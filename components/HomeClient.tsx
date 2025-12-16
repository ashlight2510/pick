"use client";

import { useEffect, useMemo, useState } from "react";
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
    const base = filtered.length ? filtered : titles;
    setResults(pickRandom(base, 10));
  }, [answers, titles]);

  const reroll = () => {
    if (!titles.length) return;
    const filtered = filterTitles(titles, answers);
    const base = filtered.length ? filtered : titles;
    setResults(pickRandom(base, 10));
  };

  const applyQuick = (preset: Partial<QuestionAnswers>) => {
    setAnswers((a) => ({ ...a, ...preset }));
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <Hero />
      <Questionnaire
        answers={answers}
        onChange={(key, value) => setAnswers((a) => ({ ...a, [key]: value }))}
      />
      <div className="space-y-4">
        <QuickPicks onPick={applyQuick} />
        <ResultGrid items={results} onReroll={reroll} />
      </div>
    </main>
  );
}
