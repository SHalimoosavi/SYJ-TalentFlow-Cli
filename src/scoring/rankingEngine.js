/**
 * Classifies a scored candidate into Shortlisted / Review / Rejected
 * based on the configured thresholds, and sorts the full candidate list
 * from strongest to weakest match.
 */
export function classify(overallScore, thresholds) {
  if (overallScore >= thresholds.shortlistThreshold) return 'Shortlisted';
  if (overallScore >= thresholds.reviewThreshold) return 'Review';
  return 'Rejected';
}

export function rankCandidates(scoredCandidates, thresholds) {
  const withStatus = scoredCandidates.map((candidate) => ({
    ...candidate,
    status: classify(candidate.overallScore, thresholds),
  }));

  return withStatus.sort((a, b) => b.overallScore - a.overallScore);
}

export function summarize(rankedCandidates) {
  const counts = { Shortlisted: 0, Review: 0, Rejected: 0 };
  let scoreSum = 0;

  for (const candidate of rankedCandidates) {
    counts[candidate.status] = (counts[candidate.status] || 0) + 1;
    scoreSum += candidate.overallScore;
  }

  const average = rankedCandidates.length ? Math.round(scoreSum / rankedCandidates.length) : 0;

  return { ...counts, total: rankedCandidates.length, averageScore: average };
}
