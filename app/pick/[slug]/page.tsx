import fs from "fs/promises";
import path from "path";
import Link from "next/link";

type TitleItem = {
  id: number;
  type: "movie" | "tv";
  title: string;
  poster?: string;
  score: number;
  votes: number;
  runtime?: number | null;
  episode_runtime?: number | null;
  ott: string[];
  tags?: string[];
  reason?: string;
};

type PickConfig = {
  title: string;
  description: string;
  filter: (item: TitleItem) => boolean;
};

const PICK_MAP: Record<string, PickConfig> = {
  "must-watch": {
    title: "🔥 무조건 추천",
    description: "FunnyPick Score 85점 이상, 실패 확률 낮은 작품",
    filter: (i) => i.score >= 85,
  },
  short: {
    title: "⏱ 2시간 이하",
    description: "짧게 보기 좋은 러닝타임 / 회당 40분 이하",
    filter: (i) => (i.runtime && i.runtime <= 120) || (i.episode_runtime && i.episode_runtime <= 40),
  },
  netflix: {
    title: "📺 넷플릭스 바로 보기",
    description: "넷플릭스에서 바로 볼 수 있는 작품",
    filter: (i) => i.ott?.some((o) => o.toLowerCase().includes("netflix")),
  },
  "hidden-gems": {
    title: "🎯 숨은 명작",
    description: "평점은 높은데 덜 알려진 작품",
    filter: (i) => i.score >= 75 && i.votes < 5000,
  },
};

function normalizeOtt(ott: string[]) {
  const mapped = ott.map((o) => (o === "Netflix Standard with Ads" ? "Netflix" : o));
  return Array.from(new Set(mapped));
}

async function loadTitles(): Promise<TitleItem[]> {
  const dataPath = path.join(process.cwd(), "data", "titles.json");
  const fallbackPath = path.join(process.cwd(), "public", "data", "titles.json");
  try {
    const raw = await fs.readFile(dataPath, "utf8");
    const parsed = JSON.parse(raw);
    return (
      parsed.items?.map((i: TitleItem) => ({
        ...i,
        ott: normalizeOtt(i.ott ?? []),
      })) ?? []
    );
  } catch {
    const raw = await fs.readFile(fallbackPath, "utf8");
    const parsed = JSON.parse(raw);
    return (
      parsed.items?.map((i: TitleItem) => ({
        ...i,
        ott: normalizeOtt(i.ott ?? []),
      })) ?? []
    );
  }
}

export default async function PickPage({ params }: { params: { slug: string } }) {
  const config = PICK_MAP[params.slug];
  if (!config) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">페이지를 찾을 수 없습니다.</h1>
        <Link href="/" className="text-blue-600 underline">
          홈으로 돌아가기
        </Link>
      </main>
    );
  }

  const titles = await loadTitles();
  const filtered = titles.filter(config.filter).slice(0, 40);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">{config.title}</h1>
      <p className="text-gray-500 mb-6">{config.description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {filtered.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            href={`/title/${item.id}`}
            className="rounded-lg border hover:shadow overflow-hidden bg-white"
          >
            <div className="aspect-[2/3] bg-gray-100 overflow-hidden">
              {item.poster && (
                <img
                  src={`https://image.tmdb.org/t/p/w500${item.poster}`}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
            <div className="p-2">
              <div className="text-sm font-medium truncate">{item.title}</div>
              <div className="text-xs text-gray-500">
                {item.score}점 · {item.ott?.[0] ?? "OTT"}
              </div>
              {(item.reason || item.tags?.length) && (
                <div className="text-xs text-gray-400 overflow-hidden text-ellipsis">
                  {item.reason ?? item.tags?.[0]}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
