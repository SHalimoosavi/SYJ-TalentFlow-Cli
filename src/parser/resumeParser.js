import path from 'node:path';
import {
  extractEmail,
  extractName,
  extractPhone,
  extractSection,
  normalizeWhitespace,
  splitList,
  stripMarkdown,
  tokenize,
} from '../utils/textUtils.js';
import { listResumeFiles, readTextFile, writeJsonFile } from '../utils/fileUtils.js';

const SECTION_HEADINGS = {
  skills: ['skills', 'technical skills', 'core skills', 'skillset'],
  experience: ['experience', 'work experience', 'employment history', 'professional experience'],
  education: ['education', 'academic background', 'qualifications'],
  certifications: ['certifications', 'certificates', 'licenses'],
  projects: ['projects', 'personal projects', 'key projects'],
};

/**
 * PDF resumes are intentionally NOT supported by the core parser — see
 * docs/plugins.md. This keeps TalentFlow dependency-light and fully
 * functional inside Android/Termux, where large PDF libraries and native
 * builds are impractical.
 */
export function isPdfResume(filePath) {
  return path.extname(filePath).toLowerCase() === '.pdf';
}

export async function parseResumeFile(filePath) {
  if (isPdfResume(filePath)) {
    throw new Error(
      `"${path.basename(filePath)}" is a PDF. TalentFlow's core parser only reads .txt/.md ` +
        'resumes to stay lightweight — enable a PDF plugin (see docs/plugins.md) or export it to text first.'
    );
  }

  const raw = await readTextFile(filePath);
  const clean = normalizeWhitespace(stripMarkdown(raw));

  const skills = splitList(extractSection(clean, SECTION_HEADINGS.skills));
  const experienceText = extractSection(clean, SECTION_HEADINGS.experience);
  const educationText = extractSection(clean, SECTION_HEADINGS.education);
  const certifications = splitList(extractSection(clean, SECTION_HEADINGS.certifications));
  const projects = splitList(extractSection(clean, SECTION_HEADINGS.projects));

  const parsed = {
    id: path.basename(filePath, path.extname(filePath)),
    sourceFile: filePath,
    name: extractName(clean),
    email: extractEmail(clean),
    phone: extractPhone(clean),
    skills,
    experience: {
      raw: experienceText,
      years: estimateYearsOfExperience(experienceText || clean),
    },
    education: educationText,
    certifications,
    projects,
    keywords: [...new Set(tokenize(clean))],
    rawText: clean,
    parsedAt: new Date().toISOString(),
  };

  return parsed;
}

/**
 * Rough heuristic: scans for explicit "X years" mentions, and falls back
 * to counting distinct 4-digit years mentioned (as a proxy for a career
 * timeline) when no explicit figure is present.
 */
function estimateYearsOfExperience(text) {
  if (!text) return 0;
  const explicit = text.match(/(\d+(?:\.\d+)?)\+?\s*years?/i);
  if (explicit) return Number(explicit[1]);

  const years = [...text.matchAll(/(19|20)\d{2}/g)].map((m) => Number(m[0]));
  if (years.length >= 2) {
    const span = Math.max(...years) - Math.min(...years);
    return Math.min(Math.max(span, 0), 40);
  }
  return 0;
}

/**
 * Parses every supported resume in a directory, writes normalized JSON
 * next to the parsed output directory, and returns the in-memory list.
 */
export async function parseResumeDirectory(resumesDir, { outputDir, onFile } = {}) {
  const files = await listResumeFiles(resumesDir);
  const results = [];

  for (const file of files) {
    try {
      const parsed = await parseResumeFile(file);
      results.push(parsed);
      if (outputDir) {
        await writeJsonFile(path.join(outputDir, `${parsed.id}.json`), parsed);
      }
      onFile?.({ file, ok: true, parsed });
    } catch (error) {
      onFile?.({ file, ok: false, error });
    }
  }

  return results;
}
