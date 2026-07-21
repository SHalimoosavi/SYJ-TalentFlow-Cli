import { readTextFile } from '../utils/fileUtils.js';
import {
  extractSection,
  splitList,
  stripMarkdown,
  tokenize,
  normalizeWhitespace,
} from '../utils/textUtils.js';

const SKILL_HEADINGS = ['skills', 'required skills', 'must have', 'tech stack', 'technologies'];
const EXPERIENCE_HEADINGS = ['experience', 'seniority', 'years of experience', 'requirements'];

/**
 * Parses a plain-text or Markdown job description into a structured
 * object the scoring engine can compare resumes against.
 */
export async function parseJobDescription(jdPath) {
  const raw = await readTextFile(jdPath);
  const clean = normalizeWhitespace(stripMarkdown(raw));

  const skillsBlock = extractSection(clean, SKILL_HEADINGS);
  const skills = splitList(skillsBlock).filter(isLikelySkill);

  const experienceBlock = extractSection(clean, EXPERIENCE_HEADINGS);
  const minYears = extractMinYears(clean) ?? extractMinYears(experienceBlock);

  const titleLine = clean.split('\n').find((l) => l.trim().length > 0) || 'Untitled Role';

  return {
    sourcePath: jdPath,
    title: titleLine.trim().slice(0, 120),
    rawText: clean,
    skills: skills.length ? skills : inferSkillsFromKeywords(clean),
    minYearsExperience: minYears,
    keywords: [...new Set(tokenize(clean))],
  };
}

// Skills should read like short nouns/tech names, not full sentences.
function isLikelySkill(value) {
  if (!value) return false;
  const wordCount = value.trim().split(/\s+/).length;
  if (/\byears?\b/i.test(value)) return false;
  if (/[.!?]\s*$/.test(value.trim()) && wordCount > 3) return false;
  return wordCount <= 5;
}

function extractMinYears(text) {
  if (!text) return null;
  const match = text.match(/(\d+)\+?\s*(?:-\s*\d+\s*)?years?/i);
  return match ? Number(match[1]) : null;
}

// Fallback so job descriptions without a clean "Skills:" section still
// produce something useful to match against.
const COMMON_TECH_TERMS = [
  'javascript',
  'typescript',
  'node.js',
  'nodejs',
  'react',
  'vue',
  'angular',
  'python',
  'java',
  'go',
  'golang',
  'rust',
  'sql',
  'nosql',
  'mongodb',
  'postgresql',
  'mysql',
  'aws',
  'gcp',
  'azure',
  'docker',
  'kubernetes',
  'graphql',
  'rest',
  'api',
  'ci/cd',
  'git',
  'agile',
  'scrum',
  'html',
  'css',
  'redux',
  'next.js',
  'express',
  'django',
  'flask',
  'terraform',
  'linux',
  'machine learning',
  'ai',
  'llm',
  'testing',
  'jest',
];

function inferSkillsFromKeywords(text) {
  const lower = text.toLowerCase();
  return COMMON_TECH_TERMS.filter((term) => lower.includes(term));
}
