"use client";

import { useEffect, useState } from "react";
import { Hero } from "./Hero";
import { QuickPicks } from "./QuickPicks";
import { Questionnaire } from "./Questionnaire";
import { ResultGrid } from "./ResultGrid";
import {
  loadTitles,
  filterTitles,
  pickRandom,
  QuestionAnswers,
  TitleItem,
} from "@/lib/data-client";

export function HomeClient() {
  const [titles, setTitles] = useState<TitleItem[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswers>({});
  const [results, setResults] = useState<TitleItem[]>([]);

  // load titles once
  useEffect(() => {
    loadTitles().then((items) => {
      setTitles(items);
      const initial = pickRandom(items, 10);
      setResults(initial);
    });
  }, []);

  // recompute results when answers change
  useEffect(() => {
    if (!titles.length) return;
    const filtered = filterTitles(titles, answers);
    const enforceFilters = Boolean(answers.actor?.trim()) || Boolean(answers.genres?.length);
    const base = filtered.length || enforceFilters ? filtered : titles;
    setResults(pickRandom(base, 10));
  }, [answers, titles]);

  const reroll = () => {
    if (!titles.length) return;
    const filtered = filterTitles(titles, answers);
    const enforceFilters = Boolean(answers.actor?.trim()) || Boolean(answers.genres?.length);
    const base = filtered.length || enforceFilters ? filtered : titles;
    setResults(pickRandom(base, 10));
  };

  const applyQuick = (preset: Partial<QuestionAnswers>) => {
    setAnswers((a) => ({ ...a, ...preset }));
  };

  const updateAnswer = (key: keyof QuestionAnswers, value: any) => {
    setAnswers((a) => {
      const next = { ...a, [key]: value };
      if (key === "actor" && !value) {
        delete next.actor;
      }
      return next;
    });
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <Hero />
      <Questionnaire
        answers={answers}
        onChange={updateAnswer}
      />
      <div className="space-y-4">
        <QuickPicks onPick={applyQuick} />
        <ResultGrid
          items={results}
          onReroll={reroll}
          actorQuery={answers.actor ?? ""}
          onActorChange={(value) => updateAnswer("actor", value)}
        />
      </div>
      <div className="flex justify-center pt-8 mt-12 border-t border-gray-200">
        <a
          href="https://funnyfunny.cloud/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors duration-200"
        >
          다른 서비스 보기
        </a>
      </div>
    </main>
  );
}
