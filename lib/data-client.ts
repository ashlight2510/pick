type TitleItem = {
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
};

type DataPayload = {
  generated_at: string;
  items: TitleItem[];
};

let cache: DataPayload | null = null;

export async function loadTitles(): Promise<TitleItem[]> {
  if (cache) return cache.items;

  try {
    const res = await fetch("/data/titles.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("데이터를 불러오지 못했습니다.");
    const data: DataPayload = await res.json();
    cache = data;
    return data.items;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export type QuestionAnswers = {
  when?: "now" | "tonight" | "weekend" | "browse";
  withWhom?: "solo" | "couple" | "family" | "friends";
  mood?: "laugh" | "relax" | "immerse" | "think";
  duration?: "1h" | "2h" | "binge" | "any";
  ott?: string;
  type?: "movie" | "tv";
};

export function filterTitles(titles: TitleItem[], answers: QuestionAnswers) {
  return titles.filter((t) => {
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
    if (answers.duration === "1h") {
      const shortEp = t.episode_runtime && t.episode_runtime <= 40;
      if (!shortEp) return false;
    }
    if (answers.duration === "2h") {
      const shortMovie = t.runtime && t.runtime <= 120;
      if (!shortMovie) return false;
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

    return true;
  });
}

export function pickRandom(list: TitleItem[], n = 10) {
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
