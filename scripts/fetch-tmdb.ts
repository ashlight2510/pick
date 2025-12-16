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
const PAGES_PER_TYPE = 3;

async function getProviders(type: MediaType, id: number): Promise<string[]> {
  const data = await tmdb(`/${type}/${id}/watch/providers`);
  return data?.results?.KR?.flatrate?.map((p: any) => p.provider_name) ?? [];
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

function normalizeItem(item: any, type: MediaType, ott: string[]) {
  const score = calcFunnyPickScore(item.vote_average, item.vote_count, ott.length);
  const tags = buildTags(item, ott);
  return {
    id: item.id,
    type,
    title: item.title || item.name,
    title_original: item.original_title || item.original_name,
    poster: item.poster_path,
    backdrop: item.backdrop_path,
    year: (item.release_date || item.first_air_date || "").slice(0, 4),
    runtime: item.runtime ?? null,
    episode_runtime: item.episode_run_time?.[0] ?? null,
    score,
    votes: item.vote_count,
    ott,
    tags,
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
        const ott = await getProviders(type, item.id);
        if (ott.length === 0) continue; // keep only titles watchable in KR OTT
        collected.push(normalizeItem(item, type, ott));
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
