"use client";

import { useEffect, useState } from "react";
import { loadTitles, filterTitles, pickRandom, QuestionAnswers } from "@/lib/data-client";
import Link from "next/link";

const OTT_OPTIONS = ["Netflix", "Netflix Standard with Ads", "wavve", "Watcha", "TVING", "Disney Plus"];

type ViewState = "idle" | "loading" | "ready" | "error";

export function Questionnaire() {
  const [answers, setAnswers] = useState<QuestionAnswers>({});
  const [titles, setTitles] = useState<any[]>([]);
  const [view, setView] = useState<ViewState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<any[]>([]);

  useEffect(() => {
    loadTitles()
      .then((items) => {
        setTitles(items);
        setView("ready");
      })
      .catch((err) => {
        console.error(err);
        setError("데이터를 불러오지 못했습니다.");
        setView("error");
      });
  }, []);

  const nextBatch = (ans: QuestionAnswers) => {
    const filtered = filterTitles(titles, ans);
    const list = filtered.length ? filtered : titles;
    return pickRandom(list, 10);
  };

  // Initial recommendations once titles are ready
  useEffect(() => {
    if (view === "ready" && titles.length && recommended.length === 0) {
      setRecommended(nextBatch(answers));
    }
  }, [view, titles, recommended.length, answers]);

  const onChange = (key: keyof QuestionAnswers, value: any) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setRecommended(nextBatch({ ...answers, [key]: value }));
  };

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">검색 말고, 바로 추천받기</h2>
        <p className="text-gray-500">질문 5개 중 3~4개만 골라도 10개 바로 보여줄게요.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500 mb-2">Q1. 언제 볼까?</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "지금 바로", value: "now" },
              { label: "오늘 밤", value: "tonight" },
              { label: "주말 몰아보기", value: "weekend" },
              { label: "그냥 찾는 중", value: "browse" },
            ].map((opt) => (
              <Button
                key={opt.value}
                active={answers.when === opt.value}
                onClick={() => onChange("when", opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm text-gray-500 mb-2">Q2. 누구와?</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "혼자", value: "solo" },
              { label: "연인", value: "couple" },
              { label: "가족", value: "family" },
              { label: "친구", value: "friends" },
            ].map((opt) => (
              <Button
                key={opt.value}
                active={answers.withWhom === opt.value}
                onClick={() => onChange("withWhom", opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm text-gray-500 mb-2">Q3. 기분은?</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "웃고 싶다", value: "laugh" },
              { label: "편하게", value: "relax" },
              { label: "몰입", value: "immerse" },
              { label: "생각할 거리", value: "think" },
            ].map((opt) => (
              <Button
                key={opt.value}
                active={answers.mood === opt.value}
                onClick={() => onChange("mood", opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm text-gray-500 mb-2">Q4. 시간은?</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "1시간 내외", value: "1h" },
              { label: "2시간 내외", value: "2h" },
              { label: "여러 편 가능", value: "binge" },
              { label: "상관없음", value: "any" },
            ].map((opt) => (
              <Button
                key={opt.value}
                active={answers.duration === opt.value}
                onClick={() => onChange("duration", opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm text-gray-500 mb-2">Q5. 어디서 볼까?</p>
          <div className="flex gap-2 flex-wrap">
            {OTT_OPTIONS.map((ott) => (
              <Button key={ott} active={answers.ott === ott} onClick={() => onChange("ott", ott)}>
                {ott}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => setRecommended(nextBatch(answers))}
          className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
          disabled={view === "loading" || view === "error"}
        >
          다른 추천 돌리기
        </button>
        {view === "error" && <span className="text-sm text-red-500">{error}</span>}
        {view === "loading" && <span className="text-sm text-gray-500">불러오는 중...</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
        {recommended.map((item) => (
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
                {item.score} · {item.ott[0] ?? "OTT 미확인"}
              </div>
              {(item.reason || item.tags?.length) && (
                <div className="text-xs text-gray-400 overflow-hidden text-ellipsis">
                  {item.reason ?? item.tags[0]}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border p-3 bg-white">{children}</div>;
}

function Button({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border ${
        active ? "bg-black text-white border-black" : "hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
