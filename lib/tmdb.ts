const BASE = "https://api.themoviedb.org/3";

export async function tmdb(path: string, params: Record<string, any> = {}) {
  // If no key is provided, return an empty result so build/prerender doesn't fail.
  if (!process.env.TMDB_API_KEY) {
    return { results: [] };
  }

  const query = new URLSearchParams({
    api_key: process.env.TMDB_API_KEY,
    language: "ko-KR",
    ...params,
  });

  try {
    const res = await fetch(`${BASE}${path}?${query}`, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      // Log and return empty to avoid throwing during build.
      console.error("TMDB error", res.status, res.statusText);
      return { results: [] };
    }

    return res.json();
  } catch (err) {
    console.error("TMDB fetch failed", err);
    return { results: [] };
  }
}
