import Link from "next/link";
import { getMustWatch } from "@/lib/home-curation";
import { Questionnaire } from "@/components/Questionnaire";

export default async function HomePage() {
  const mustWatch = await getMustWatch();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold mb-2">오늘 뭐 볼까?</h1>
        <p className="text-gray-500">평점·접근성·분위기로 실패 없는 선택</p>
      </section>

      {/* Quick Picks */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
        {[
          { slug: "must-watch", label: "🔥 무조건 추천" },
          { slug: "short", label: "⏱ 2시간 이하" },
          { slug: "netflix", label: "📺 넷플릭스 바로 보기" },
          { slug: "hidden-gems", label: "🎯 숨은 명작" },
        ].map((pick) => (
          <Link
            key={pick.slug}
            href={`/pick/${pick.slug}`}
            className="rounded-xl border p-4 text-center hover:bg-gray-50"
          >
            {pick.label}
          </Link>
        ))}
      </section>

      {/* Must Watch */}
      <section>
        <h2 className="text-xl font-semibold mb-4">🔥 지금 실패 없는 선택</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {mustWatch.map((item) => (
            <Link
              key={item.id}
              href={`/title/${item.id}`}
              className="rounded-lg border hover:shadow"
            >
              <div className="aspect-[2/3] bg-gray-200 overflow-hidden">
                {item.poster && (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="p-2">
                <div className="text-sm font-medium truncate">
                  {item.title}
                </div>
                <div className="text-xs text-gray-500">
                  {item.score} 🔥 · {item.ott[0]}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Questionnaire */}
      <Questionnaire />
    </main>
  );
}
