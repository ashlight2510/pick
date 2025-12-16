import { tmdb } from "./tmdb";
import { calcFunnyPickScore } from "./score";

const PROVIDERS = "8|356|337|97"; // Netflix, wavve, TVING, Coupang

const MOCK_RESULTS = [
  {
    id: 238,
    title: "대부",
    poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    vote_average: 8.7,
    vote_count: 20342,
    ott: ["Netflix", "TVING"],
  },
  {
    id: 424694,
    title: "보헤미안 랩소디",
    poster_path: "/1pU9uJcK7rVRQ3hLCZ8ZfHlTPhd.jpg",
    vote_average: 8,
    vote_count: 15784,
    ott: ["Netflix", "wavve"],
  },
  {
    id: 129,
    title: "이웃집 토토로",
    poster_path: "/rtGDOeG9LzoerkDGZF9dnVeLppL.jpg",
    vote_average: 8.1,
    vote_count: 9211,
    ott: ["Netflix"],
  },
  {
    id: 150540,
    title: "인터스텔라",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    vote_average: 8.4,
    vote_count: 35817,
    ott: ["Netflix", "Coupang Play"],
  },
  {
    id: 496243,
    title: "기생충",
    poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    vote_average: 8.5,
    vote_count: 16922,
    ott: ["TVING"],
  },
  {
    id: 497,
    title: "위대한 쇼맨",
    poster_path: "/b9CeobiihCx1uG1tpw8hXmpi7nm.jpg",
    vote_average: 8,
    vote_count: 10724,
    ott: ["Disney Plus"],
  },
];

async function getProviders(type: "movie" | "tv", id: number) {
  // When TMDB key is missing, skip provider fetch to avoid errors during build.
  if (!process.env.TMDB_API_KEY) return [];

  const data = await tmdb(`/${type}/${id}/watch/providers`);
  return data?.results?.KR?.flatrate?.map((p: any) => p.provider_name) ?? [];
}

export async function getMustWatch() {
  const useMock = !process.env.TMDB_API_KEY;

  try {
    if (useMock) {
      return MOCK_RESULTS.map((item) => ({
        id: item.id,
        title: item.title,
        poster: item.poster_path,
        score: calcFunnyPickScore(
          item.vote_average,
          item.vote_count,
          item.ott.length
        ),
        ott: item.ott,
      }));
    }

    const data = await tmdb("/discover/movie", {
      region: "KR",
      with_watch_providers: PROVIDERS,
      watch_region: "KR",
      "vote_average.gte": 7,
      "vote_count.gte": 500,
      sort_by: "popularity.desc",
      page: 1,
    });

    const results = Array.isArray((data as any)?.results)
      ? (data as any).results
      : [];

    const items = await Promise.all(
      results.slice(0, 6).map(async (item: any) => {
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
  } catch (err) {
    // Any failure falls back to mock data so build/prerender never breaks.
    return MOCK_RESULTS.map((item) => ({
      id: item.id,
      title: item.title,
      poster: item.poster_path,
      score: calcFunnyPickScore(
        item.vote_average,
        item.vote_count,
        item.ott.length
      ),
      ott: item.ott,
    }));
  }
}
