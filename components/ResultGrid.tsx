import Link from "next/link";
import { TitleItem } from "@/lib/data-client";

export function ResultGrid({
  items,
  onReroll,
}: {
  items: TitleItem[];
  onReroll: () => void;
}) {
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">추천 결과</h2>
        <button
          onClick={onReroll}
          className="px-3 py-1 rounded-lg border text-sm bg-white border-gray-200 shadow-sm hover:-translate-y-0.5 transition hover:shadow"
        >
          다른 추천 돌리기
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {items.map((item) => (
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
    </section>
  );
}
