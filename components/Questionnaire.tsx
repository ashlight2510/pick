"use client";

import { QuestionAnswers } from "@/lib/data-client";

const OTT_OPTIONS = ["Netflix", "wavve", "Watcha", "TVING", "Disney Plus"];
const GENRE_OPTIONS = [
  "액션",
  "코미디",
  "드라마",
  "스릴러",
  "로맨스",
  "SF/판타지",
  "범죄",
  "다큐멘터리",
  "애니메이션",
  "가족/키즈",
  "공포",
];

export function Questionnaire({
  answers,
  onChange,
}: {
  answers: QuestionAnswers;
  onChange: (key: keyof QuestionAnswers, value: any) => void;
}) {
  const toggleGenre = (genre: string) => {
    const current = answers.genres ?? [];
    const exists = current.includes(genre);
    const next = exists ? current.filter((g) => g !== genre) : [...current, genre];
    onChange("genres", next);
  };

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">상황을 알려주면 바로 추천해줄게요</h2>
        <p className="text-gray-500 text-sm">필요한 것만 골라도 됩니다.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Q0. 형식은?">
          {[
            { label: "상관없음", value: undefined },
            { label: "단편(영화)", value: "movie" },
            { label: "드라마(시리즈)", value: "tv" },
          ].map((opt) => (
            <Button
              key={opt.label}
              active={
                opt.value === undefined ? !answers.type : answers.type === opt.value
              }
              onClick={() => onChange("type", opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </Card>
        <Card title="Q1. 언제 볼까?">
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
        </Card>

        <Card title="Q2. 누구와?">
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
        </Card>

        <Card title="Q3. 기분은?">
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
        </Card>

        <Card title="Q4. 시간은?">
          {[
            { label: "40분 이하", value: "40m" },
            { label: "1시간 이하", value: "60m" },
            { label: "1시간 20분 이하", value: "80m" },
            { label: "2시간 이하", value: "120m" },
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
        </Card>

        <Card title="Q5. 어디서 볼까?">
          {OTT_OPTIONS.map((ott) => (
            <Button key={ott} active={answers.ott === ott} onClick={() => onChange("ott", ott)}>
              {ott}
            </Button>
          ))}
        </Card>

        <Card title="Q6. 어떤 장르가 땡겨?">
          {GENRE_OPTIONS.map((genre) => (
            <Button
              key={genre}
              active={answers.genres?.includes(genre)}
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </Button>
          ))}
        </Card>
      </div>
    </section>
  );
}

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <p className="text-sm text-gray-800 mb-3 font-semibold">{title}</p>
      <div className="flex gap-2 flex-wrap">{children}</div>
    </div>
  );
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
      className={`px-3 py-1 rounded-full text-sm border transition ${
        active
          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
          : "bg-white border-gray-200 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
