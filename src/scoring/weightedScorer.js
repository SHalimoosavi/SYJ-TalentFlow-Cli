import { scoreKeywords } from './keywordScorer.js';

function normalize(str) {
  return str.toLowerCase().trim();
}

/**
 * Compares a resume's declared skills against the job description's
 * required skills, and combines it with an experience-years match and
 * plain keyword overlap into a single weighted score.
 */
export function scoreSkills(resume, jobDescription) {
  const required = jobDescription.skills.map(normalize);
  if (required.length === 0) {
    return { score: 100, matchedSkills: [], missingSkills: [] };
  }

  const resumeSkills = new Set(resume.skills.map(normalize));
  const resumeText = resume.rawText.toLowerCase();

  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of required) {
    const found = resumeSkills.has(skill) || resumeText.includes(skill);
    if (found) matchedSkills.push(skill);
    else missingSkills.push(skill);
  }

  const score = Math.round((matchedSkills.length / required.length) * 100);
  return { score, matchedSkills, missingSkills };
}

export function scoreExperience(resume, jobDescription) {
  const required = jobDescription.minYearsExperience;
  const actual = resume.experience?.years ?? 0;

  if (!required || required <= 0) {
    return { score: 100, requiredYears: 0, actualYears: actual };
  }

  const ratio = actual / required;
  const score = Math.round(Math.min(ratio, 1.25) * 100);
  return { score: Math.min(score, 100), requiredYears: required, actualYears: actual };
}

/**
 * Combines skills, experience, and keyword scores using the configured
 * weights to produce a single overall percentage score.
 */
export function scoreWeighted(resume, jobDescription, weights) {
  const skills = scoreSkills(resume, jobDescription);
  const experience = scoreExperience(resume, jobDescription);
  const keywords = scoreKeywords(resume, jobDescription);

  const totalWeight = weights.skillsWeight + weights.experienceWeight + weights.keywordWeight || 1;

  const overall =
    (skills.score * weights.skillsWeight +
      experience.score * weights.experienceWeight +
      keywords.score * weights.keywordWeight) /
    totalWeight;

  return {
    overall: Math.round(overall),
    skills,
    experience,
    keywords,
  };
}
