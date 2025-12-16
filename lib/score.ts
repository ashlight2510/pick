export function calcFunnyPickScore(
  voteAverage: number,
  voteCount: number,
  ottCount: number
) {
  const scoreNorm = voteAverage * 10;
  const voteWeight = Math.log10(voteCount + 1) / 4;
  const ottWeight = Math.min(1, 0.7 + ottCount * 0.15);

  return Math.round(
    scoreNorm * 0.6 +
      scoreNorm * voteWeight * 0.25 +
      scoreNorm * ottWeight * 0.15
  );
}
