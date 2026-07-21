import { truncate } from '../utils/textUtils.js';

const SYSTEM_PROMPT = `You are TalentFlow, an expert technical recruiter and resume screener.
You evaluate a single candidate resume against a single job description and
respond with STRICT JSON only — no prose, no markdown fences, no preamble.

The JSON object must exactly match this shape:
{
  "overallScore": number (0-100),
  "skillMatchScore": number (0-100),
  "experienceMatchScore": number (0-100),
  "missingSkills": string[],
  "strengths": string[],
  "weaknesses": string[],
  "recruiterSummary": string (2-4 sentences, written for a busy recruiter)
}`;

function buildUserPrompt(resume, jobDescription) {
  return [
    `## Job Description: ${jobDescription.title}`,
    truncate(jobDescription.rawText, 3000),
    '',
    `## Candidate Resume: ${resume.name}`,
    truncate(resume.rawText, 3000),
    '',
    'Evaluate the fit and respond with the JSON object only.',
  ].join('\n');
}

function safeParseJson(text) {
  const cleaned = text
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '');
  return JSON.parse(cleaned);
}

/**
 * Runs a semantic (LLM-based) evaluation of one resume against one job
 * description via the configured AI provider. Falls back gracefully by
 * throwing a descriptive error the caller can catch and degrade from.
 */
export async function scoreSemantic(resume, jobDescription, provider) {
  const response = await provider.complete({
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(resume, jobDescription),
    maxTokens: 800,
  });

  let parsed;
  try {
    parsed = safeParseJson(response);
  } catch {
    throw new Error(
      `AI provider returned non-JSON output for "${resume.name}". Raw: ${truncate(response, 200)}`
    );
  }

  return {
    overallScore: clampScore(parsed.overallScore),
    skillMatchScore: clampScore(parsed.skillMatchScore),
    experienceMatchScore: clampScore(parsed.experienceMatchScore),
    missingSkills: parsed.missingSkills ?? [],
    strengths: parsed.strengths ?? [],
    weaknesses: parsed.weaknesses ?? [],
    recruiterSummary: parsed.recruiterSummary ?? '',
  };
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
