import fs from "fs/promises";
import path from "path";
import { config as loadEnv } from "dotenv";
import { tmdb } from "../lib/tmdb";
import { calcFunnyPickScore } from "../lib/score";

// Load .env.local first, then fallback to .env
loadEnv({ path: ".env.local" });
loadEnv();

type MediaType = "movie" | "tv";

const PROVIDERS = "8|356|337|97"; // Netflix, wavve, TVING, Coupang
const PAGES_PER_TYPE = 5;

// TMDB genre id -> FunnyPick genre label (Korean)
const GENRE_MAP: Record<number, string[]> = {
  28: ["액션"], // Action
  12: ["액션"], // Adventure
  10759: ["액션"], // Action & Adventure (TV)
  35: ["코미디"],
  18: ["드라마"],
  53: ["스릴러"],
  9648: ["스릴러"],
  80: ["범죄"],
  10749: ["로맨스"],
  878: ["SF/판타지"],
  14: ["SF/판타지"],
  10765: ["SF/판타지"],
  99: ["다큐멘터리"],
  16: ["애니메이션"],
  10751: ["가족/키즈"],
  10762: ["가족/키즈"],
  27: ["공포"],
  36: ["드라마"], // History
  10752: ["드라마"], // War
  37: ["드라마"], // Western
  10402: ["음악"],
};

async function getProviders(type: MediaType, id: number): Promise<string[]> {
  const data = await tmdb(`/${type}/${id}/watch/providers`);
  return data?.results?.KR?.flatrate?.map((p: any) => p.provider_name) ?? [];
}

async function getDetails(type: MediaType, id: number): Promise<any> {
  return tmdb(`/${type}/${id}`, { language: "ko-KR" });
}

function mapGenres(genreIds: number[] = []): string[] {
  const labels = genreIds.flatMap((id) => GENRE_MAP[id] ?? []);
  return Array.from(new Set(labels));
}

async function getTopCast(type: MediaType, id: number): Promise<string[]> {
  const data = await tmdb(`/${type}/${id}/credits`, { language: "ko-KR" });
  const cast = Array.isArray(data?.cast) ? data.cast : [];
  const names = cast
    .slice(0, 8)
    .map((c: any) => c.name || c.original_name)
    .filter(Boolean);
  return Array.from(new Set(names));
}

function buildTags(item: any, ott: string[]) {
  const tags: string[] = [];
  if (item.vote_average >= 8.5 || item.score >= 85) tags.push("무조건 추천");
  if (item.vote_count >= 5000) tags.push("대중픽");
  if (item.vote_count < 500 && (item.vote_average ?? 0) >= 7.5) tags.push("숨은 명작");
  if (ott.length >= 2) tags.push("접근성 좋음");
  if (item.runtime && item.runtime <= 120) tags.push("가볍게 보기");
  if (item.episode_run_time?.[0] && item.episode_run_time[0] <= 40)
    tags.push("부담 없는 정주행");
  return tags;
}

function buildReason(tags: string[], score: number) {
  if (tags.includes("무조건 추천")) return "평점과 접근성이 모두 검증된 작품";
  if (tags.includes("숨은 명작")) return "아는 사람만 아는 저평가 명작";
  if (tags.includes("가볍게 보기") || tags.includes("부담 없는 정주행"))
    return "부담 없이 보기 좋은 길이";
  if (tags.includes("접근성 좋음")) return "여러 OTT에서 바로 볼 수 있음";
  if (score >= 80) return "대부분 만족하는 평점";
  return "취향 맞으면 꽤 만족도 높은 선택";
}

function normalizeItem(item: any, detail: any, type: MediaType, ott: string[], cast: string[]) {
  const score = calcFunnyPickScore(item.vote_average, item.vote_count, ott.length);
  const tags = buildTags(item, ott);
  const runtime = detail?.runtime ?? item.runtime ?? null;
  const epRuntime =
    detail?.episode_run_time?.[0] ?? detail?.episode_run_time ?? item.episode_run_time?.[0] ?? null;
  const genreIds =
    detail?.genres?.map((g: any) => g.id).filter(Boolean) ??
    detail?.genre_ids ??
    item.genre_ids ??
    [];
  return {
    id: item.id,
    type,
    title: item.title || item.name,
    title_original: detail?.original_title || detail?.original_name || item.original_title || item.original_name,
    poster: item.poster_path,
    backdrop: item.backdrop_path,
    year: (item.release_date || item.first_air_date || detail?.release_date || detail?.first_air_date || "").slice(
      0,
      4
    ),
    runtime,
    episode_runtime: epRuntime,
    score,
    votes: item.vote_count,
    ott,
    tags,
    genres: mapGenres(genreIds),
    cast,
    reason: buildReason(tags, score),
  };
}

async function fetchDiscover(type: MediaType, page: number) {
  return tmdb(`/discover/${type}`, {
    region: "KR",
    with_watch_providers: PROVIDERS,
    watch_region: "KR",
    "vote_average.gte": type === "movie" ? 7 : 7,
    "vote_count.gte": type === "movie" ? 300 : 200,
    sort_by: "popularity.desc",
    page,
  });
}

async function main() {
  if (!process.env.TMDB_API_KEY) {
    console.warn("⚠️  TMDB_API_KEY is missing. No data will be fetched.");
  }

  const collected: any[] = [];

  for (const type of ["movie", "tv"] as const) {
    for (let page = 1; page <= PAGES_PER_TYPE; page++) {
      const data = await fetchDiscover(type, page);
      const results: any[] = Array.isArray(data?.results) ? data.results : [];
      if (!results.length) break;

      for (const item of results) {
        const detail = await getDetails(type, item.id);
        const ott = await getProviders(type, item.id);
        if (ott.length === 0) continue; // keep only titles watchable in KR OTT
        const cast = await getTopCast(type, item.id);
        collected.push(normalizeItem(item, detail, type, ott, cast));
      }
    }
  }

  // Deduplicate by id+type
  const unique = new Map<string, any>();
  for (const item of collected) {
    unique.set(`${item.type}-${item.id}`, item);
  }

  const outputDir = path.join(process.cwd(), "data");
  const publicDir = path.join(process.cwd(), "public", "data");
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(publicDir, { recursive: true });
  const outputPath = path.join(outputDir, "titles.json");
  const publicPath = path.join(publicDir, "titles.json");
  const payload = {
    generated_at: new Date().toISOString(),
    items: Array.from(unique.values()).sort((a, b) => b.score - a.score),
  };
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");
  await fs.writeFile(publicPath, JSON.stringify(payload, null, 2), "utf8");

  console.log(
    `✅ Saved ${payload.items.length} titles to data/titles.json and public/data/titles.json (generated_at=${payload.generated_at})`
  );
}

main().catch((err) => {
  console.error("Data build failed", err);
  process.exit(1);
});
