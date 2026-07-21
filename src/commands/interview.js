import path from 'node:path';
import { loadConfig } from '../config/config.js';
import { resolveProvider } from '../ai/resolveProvider.js';
import { readJsonFile, writeTextFile, ensureDir, pathExists, slugify } from '../utils/fileUtils.js';
import { parseJobDescription } from '../parser/jdParser.js';
import {
  INTERVIEW_SYSTEM_PROMPT,
  buildInterviewPrompt,
  fallbackInterviewKit,
  renderInterviewMarkdown,
} from '../templates/interviewTemplates.js';
import { logger } from '../utils/logger.js';

/**
 * `talentflow interview` — generates a tailored interview kit for every
 * shortlisted candidate found in <output>/candidates.json.
 */
export async function generateInterviews({ jdPath, candidatesPath, outputDir, useAi } = {}) {
  const config = loadConfig();
  const resolvedOutputDir = outputDir || config.paths.output;
  const resolvedCandidatesPath = candidatesPath || path.join(resolvedOutputDir, 'candidates.json');
  const shouldUseAi = useAi ?? config.useAi;

  if (!jdPath) throw new Error('A job description path is required (--jd <path>).');
  if (!(await pathExists(resolvedCandidatesPath))) {
    throw new Error(
      `No screened candidates found at ${resolvedCandidatesPath}. Run "talentflow screen" first.`
    );
  }

  const jobDescription = await parseJobDescription(jdPath);
  const candidates = await readJsonFile(resolvedCandidatesPath);
  const shortlisted = candidates.filter((c) => c.status === 'Shortlisted');

  if (shortlisted.length === 0) {
    logger.warn('No shortlisted candidates found — nothing to generate interview kits for.');
    return { kits: [] };
  }

  const provider = resolveProvider(config, shouldUseAi, 'AI interview generation');

  const interviewDir = path.join(resolvedOutputDir, 'interviews');
  await ensureDir(interviewDir);

  const kits = [];
  for (const candidate of shortlisted) {
    let kit;
    if (provider) {
      try {
        const raw = await provider.complete({
          system: INTERVIEW_SYSTEM_PROMPT,
          prompt: buildInterviewPrompt(candidate, jobDescription),
          maxTokens: 900,
        });
        kit = JSON.parse(
          raw
            .trim()
            .replace(/^```json/i, '')
            .replace(/^```/, '')
            .replace(/```$/, '')
        );
      } catch (error) {
        logger.warn(`AI interview generation failed for ${candidate.name}, using fallback: ${error.message}`);
        kit = fallbackInterviewKit(candidate, jobDescription);
      }
    } else {
      kit = fallbackInterviewKit(candidate, jobDescription);
    }

    const markdown = renderInterviewMarkdown(candidate, jobDescription, kit);
    const filePath = path.join(interviewDir, `${slugify(candidate.name)}.md`);
    await writeTextFile(filePath, markdown);
    logger.success(`Interview kit written for ${candidate.name} → ${filePath}`);
    kits.push({ candidate: candidate.name, filePath, kit });
  }

  logger.info(`Generated ${kits.length} interview kit(s) → ${interviewDir}`);
  return { kits, outputDir: interviewDir };
}
