import { QuestionAnswers } from "@/lib/data-client";

const QUICK_PRESETS: { label: string; preset: Partial<QuestionAnswers>; slug: string }[] = [
  { label: "🔥 무조건 추천", preset: { extra: "must" }, slug: "must-watch" },
  { label: "⏱ 2시간 이하", preset: { duration: "2h" }, slug: "short" },
  { label: "📺 넷플릭스 바로 보기", preset: { ott: "Netflix" }, slug: "netflix" },
  { label: "🎯 숨은 명작", preset: { extra: "hidden" }, slug: "hidden-gems" },
];

export function QuickPicks({ onPick }: { onPick: (preset: Partial<QuestionAnswers>) => void }) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
      {QUICK_PRESETS.map((pick) => (
        <button
          key={pick.slug}
          onClick={() => onPick(pick.preset)}
          className="w-full rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          {pick.label}
        </button>
      ))}
    </section>
  );
}
