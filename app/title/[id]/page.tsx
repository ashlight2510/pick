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

const PROVIDER_URL: Record<string, string> = {
  Netflix: "https://www.netflix.com",
  wavve: "https://www.wavve.com",
  Watcha: "https://watcha.com",
  TVING: "https://www.tving.com",
  "Disney Plus": "https://www.disneyplus.com",
  "Amazon Prime Video": "https://www.primevideo.com",
  Crunchyroll: "https://www.crunchyroll.com",
};

async function loadTitle(id: number): Promise<TitleItem | null> {
  const dataPath = path.join(process.cwd(), "data", "titles.json");
  const fallbackPath = path.join(process.cwd(), "public", "data", "titles.json");
  const candidates = [dataPath, fallbackPath];

  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf8");
      const parsed = JSON.parse(raw);
      const found = (parsed.items as TitleItem[]).find((i) => i.id === id);
      if (found) return found;
    } catch {
      // keep trying next path
    }
  }
  return null;
}

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = Number(id);
  const item = await loadTitle(idNum);

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
        <p className="text-sm text-gray-500">곧 업데이트 예정</p>
      </section>
    </main>
  );
}
