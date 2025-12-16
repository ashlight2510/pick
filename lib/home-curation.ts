import { tmdb } from "./tmdb";
import { calcFunnyPickScore } from "./score";

const PROVIDERS = "8|356|337|97"; // Netflix, wavve, TVING, Coupang

async function getProviders(type: "movie" | "tv", id: number) {
  const data = await tmdb(`/${type}/${id}/watch/providers`);
  return data?.results?.KR?.flatrate?.map((p: any) => p.provider_name) ?? [];
}

export async function getMustWatch() {
  const data = await tmdb("/discover/movie", {
    region: "KR",
    with_watch_providers: PROVIDERS,
    watch_region: "KR",
    vote_average: { gte: 7 },
    vote_count: { gte: 500 },
    sort_by: "popularity.desc",
    page: 1,
  });

  const items = await Promise.all(
    data.results.slice(0, 6).map(async (item: any) => {
      const ott = await getProviders("movie", item.id);
      const score = calcFunnyPickScore(
        item.vote_average,
        item.vote_count,
        ott.length
      );

      return {
        id: item.id,
        title: item.title,
        poster: item.poster_path,
        score,
        ott,
      };
    })
  );

  return items.sort((a, b) => b.score - a.score);
}
