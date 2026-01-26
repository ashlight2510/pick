export type TitleItem = {
  id: number;
  type: "movie" | "tv";
  title: string;
  title_original?: string;
  poster?: string;
  backdrop?: string;
  year?: string;
  runtime?: number | null;
  episode_runtime?: number | null;
  score: number;
  votes: number;
  ott: string[];
  tags: string[];
  reason?: string;
  genres?: string[];
  cast?: string[];
};

type DataPayload = {
  generated_at: string;
  items: TitleItem[];
};

function normalizeOtt(ott: string[]) {
  const mapped = ott.map((o) => (o === "Netflix Standard with Ads" ? "Netflix" : o));
  return Array.from(new Set(mapped));
}

let cache: DataPayload | null = null;

export async function loadTitles(): Promise<TitleItem[]> {
  if (cache) return cache.items;

  try {
    const res = await fetch("/data/titles.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("데이터를 불러오지 못했습니다.");
    const data: DataPayload = await res.json();
    const items =
      data.items?.map((i) => ({
        ...i,
        ott: normalizeOtt(i.ott ?? []),
        genres: i.genres ?? [],
        cast: i.cast ?? [],
      })) ?? [];
    cache = { ...data, items };
    return items;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export type QuestionAnswers = {
  when?: "now" | "tonight" | "weekend" | "browse";
  withWhom?: "solo" | "couple" | "family" | "friends";
  mood?: "laugh" | "relax" | "immerse" | "think";
  duration?: "40m" | "60m" | "80m" | "120m" | "1h" | "2h" | "binge" | "any";
  ott?: string;
  type?: "movie" | "tv";
  extra?: "must" | "hidden";
  genres?: string[];
  actor?: string;
};

function getDurationLimit(duration?: QuestionAnswers["duration"]) {
  if (!duration || duration === "any" || duration === "binge") return null;
  switch (duration) {
    case "40m":
      return 40;
    case "60m":
    case "1h":
      return 60;
    case "80m":
      return 80;
    case "120m":
    case "2h":
      return 120;
    default:
      return null;
  }
}

export function filterTitles(titles: TitleItem[], answers: QuestionAnswers) {
  return titles.filter((t) => {
    const castList = t.cast ?? [];
    const genres = t.genres ?? [];

    // format preference from duration or explicit type
    if (answers.type && t.type !== answers.type) return false;
    if (answers.duration === "binge" && t.type !== "tv") return false;

    // time-based (when)
    if (answers.when === "now") {
      const shortMovie = t.runtime && t.runtime <= 120;
      const shortEp = t.episode_runtime && t.episode_runtime <= 40;
      if (!shortMovie && !shortEp) return false;
    }
    if (answers.when === "weekend" && t.type !== "tv") return false;

    // duration
    const durationLimit = getDurationLimit(answers.duration);
    if (durationLimit) {
      if (t.type === "tv") {
        const ep = t.episode_runtime;
        if (!ep || ep > durationLimit) return false;
      } else {
        const runtime = t.runtime;
        if (!runtime || runtime > durationLimit) return false;
      }
    }

    // with whom
    if (answers.withWhom === "couple" && t.score < 75) return false;
    if (answers.withWhom === "family" && t.score < 75) return false;
    if (answers.withWhom === "friends" && t.score < 70) return false;

    // mood
    if (answers.mood === "laugh") {
      const shortish = (t.runtime && t.runtime <= 120) || (t.episode_runtime && t.episode_runtime <= 40);
      if (!(shortish && t.score >= 75)) return false;
    }
    if (answers.mood === "relax") {
      const breezy = (t.episode_runtime && t.episode_runtime <= 40) || (t.runtime && t.runtime <= 120);
      if (!breezy) return false;
    }
    if (answers.mood === "immerse" && t.score < 80) return false;
    if (answers.mood === "think" && t.score < 80) return false;

    // OTT availability
    if (answers.ott && !t.ott.includes(answers.ott)) return false;

    // extra presets (퀵 버튼용)
    if (answers.extra === "must" && t.score < 85) return false;
    if (answers.extra === "hidden" && !(t.score >= 75 && t.votes < 5000)) return false;

    // genres (multi-select)
    if (answers.genres?.length) {
      const hasAll = answers.genres.every((g) => genres.includes(g));
      if (!hasAll) return false;
    }

    // actor search (case-insensitive, supports Korean)
    const actorQuery = answers.actor?.trim();
    if (actorQuery) {
      const normalizedQuery = actorQuery.toLowerCase();
      const match = castList.some((name) => name.toLowerCase().includes(normalizedQuery));
      if (!match) return false;
    }

    return true;
  });
}

export function pickRandom(list: TitleItem[], n = 10) {
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
