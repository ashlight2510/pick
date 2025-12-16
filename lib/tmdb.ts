const BASE = "https://api.themoviedb.org/3";

export async function tmdb(
  path: string,
  params: Record<string, any> = {}
) {
  const query = new URLSearchParams({
    api_key: process.env.TMDB_API_KEY!,
    language: "ko-KR",
    ...params,
  });

  const res = await fetch(`${BASE}${path}?${query}`, {
    next: { revalidate: 1800 },
  });

  if (!res.ok) throw new Error("TMDB error");
  return res.json();
}
