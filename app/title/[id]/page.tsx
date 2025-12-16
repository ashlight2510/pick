import fs from "fs/promises";
import path from "path";
import Link from "next/link";

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
  tags?: string[];
  reason?: string;
};

export async function generateStaticParams() {
  const dataPath = path.join(process.cwd(), "data", "titles.json");
  const fallbackPath = path.join(process.cwd(), "public", "data", "titles.json");
  const candidates = [dataPath, fallbackPath];
  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf8");
      const parsed = JSON.parse(raw);
      const items = parsed.items as { id: number }[];
      if (Array.isArray(items)) {
        return items.map((i) => ({ id: String(i.id) }));
      }
    } catch {
      // keep trying
    }
  }
  return [];
}

const PROVIDER_URL: Record<string, string> = {
  Netflix: "https://www.netflix.com",
  wavve: "https://www.wavve.com",
  Watcha: "https://watcha.com",
  TVING: "https://www.tving.com",
  "Disney Plus": "https://www.disneyplus.com",
  "Amazon Prime Video": "https://www.primevideo.com",
  Crunchyroll: "https://www.crunchyroll.com",
};

function normalizeOtt(ott: string[]) {
  const mapped = ott.map((o) => (o === "Netflix Standard with Ads" ? "Netflix" : o));
  return Array.from(new Set(mapped));
}

async function loadAllTitles(): Promise<TitleItem[]> {
  const dataPath = path.join(process.cwd(), "data", "titles.json");
  const fallbackPath = path.join(process.cwd(), "public", "data", "titles.json");
  const candidates = [dataPath, fallbackPath];

  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf8");
      const parsed = JSON.parse(raw);
      const items = (parsed.items as TitleItem[]).map((i) => ({
        ...i,
        ott: normalizeOtt(i.ott ?? []),
      }));
      return items;
    } catch {
      // keep trying next path
    }
  }
  return [];
}

function pickSimilar(all: TitleItem[], current: TitleItem, limit = 6) {
  const scores = all
    .filter((t) => t.id !== current.id && t.type === current.type)
    .map((t) => {
      const ottOverlap = t.ott.filter((o) => current.ott.includes(o)).length;
      const scoreGap = Math.abs((t.score ?? 0) - (current.score ?? 0));
      const sim =
        ottOverlap * 3 +
        (scoreGap <= 5 ? 3 : scoreGap <= 10 ? 2 : 0) +
        (t.year === current.year ? 1 : 0);
      return { item: t, sim };
    })
    .sort((a, b) => b.sim - a.sim || b.item.score - a.item.score);

  return scores.slice(0, limit).map((s) => s.item);
}

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = Number(id);
  const allTitles = await loadAllTitles();
  const item = allTitles.find((i) => i.id === idNum) ?? null;
  const similar = item ? pickSimilar(allTitles, item, 6) : [];

  if (!item) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">작품을 찾을 수 없습니다.</h1>
        <Link href="/" className="text-blue-600 underline">
          홈으로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
        >
          ← 메인으로 돌아가기
        </Link>
      </div>
      <section className="flex gap-6 mb-8">
        <div className="w-40 aspect-[2/3] bg-gray-200 rounded overflow-hidden">
          {item.poster && (
            <img
              src={`https://image.tmdb.org/t/p/w500${item.poster}`}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">{item.title}</h1>
          <p className="text-gray-500 mb-2">
            {item.type.toUpperCase()} · {item.year ?? "연도 미상"}
          </p>
          <div className="text-lg font-semibold mb-2">FunnyPick Score {item.score}</div>
          {item.reason && <p className="text-gray-600 text-sm mb-2">{item.reason}</p>}
          <div className="flex gap-2 flex-wrap">
            {item.tags?.map((tag) => (
              <span key={tag} className="text-xs border rounded px-2 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold mb-3">지금 볼 수 있는 곳</h2>
        <div className="flex gap-3 flex-wrap">
          {item.ott.map((o) => {
            const href = PROVIDER_URL[o] ?? "#";
            return (
              <a
                key={o}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="border rounded px-4 py-2 hover:bg-gray-50 text-sm"
              >
                {o}에서 보기
              </a>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">비슷한 추천</h2>
        {similar.length === 0 ? (
          <p className="text-sm text-gray-500">준비된 추천이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {similar.map((s) => (
              <Link
                key={`${s.type}-${s.id}`}
                href={`/title/${s.id}`}
                className="rounded-lg border overflow-hidden hover:shadow bg-white"
              >
                <div className="aspect-[2/3] bg-gray-100 overflow-hidden">
                  {s.poster && (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${s.poster}`}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-2">
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="text-xs text-gray-500">
                    {s.score}점 · {s.ott?.[0] ?? "OTT"}
                  </div>
                  {(s.reason || s.tags?.length) && (
                    <div className="text-xs text-gray-400 overflow-hidden text-ellipsis">
                      {s.reason ?? s.tags?.[0]}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
