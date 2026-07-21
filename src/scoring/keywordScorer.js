/**
 * Simple keyword overlap scoring — how many of the job description's
 * keywords appear anywhere in the resume text. Cheap, deterministic, and
 * a useful signal even without an AI provider configured.
 */
export function scoreKeywords(resume, jobDescription) {
  const jdKeywords = new Set(jobDescription.keywords);
  if (jdKeywords.size === 0) return { score: 0, matched: [], total: 0 };

  const resumeKeywords = new Set(resume.keywords);
  const matched = [...jdKeywords].filter((kw) => resumeKeywords.has(kw));

  const score = Math.round((matched.length / jdKeywords.size) * 100);
  return { score, matched, total: jdKeywords.size };
}
