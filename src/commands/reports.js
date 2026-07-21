import path from 'node:path';
import { loadConfig } from '../config/config.js';
import { readJsonFile, pathExists } from '../utils/fileUtils.js';
import { parseJobDescription } from '../parser/jdParser.js';
import { writeReports } from '../reports/reportGenerator.js';
import { summarize } from '../scoring/rankingEngine.js';
import { logger } from '../utils/logger.js';

/**
 * `talentflow reports` — regenerates Markdown/JSON/CSV reports from an
 * existing candidates.json without re-running the full screening
 * pipeline (useful after manually editing scores or thresholds).
 */
export async function generateReports({ jdPath, candidatesPath, outputDir } = {}) {
  const config = loadConfig();
  const resolvedOutputDir = outputDir || config.paths.output;
  const resolvedCandidatesPath = candidatesPath || path.join(resolvedOutputDir, 'candidates.json');

  if (!jdPath) throw new Error('A job description path is required (--jd <path>).');
  if (!(await pathExists(resolvedCandidatesPath))) {
    throw new Error(
      `No screened candidates found at ${resolvedCandidatesPath}. Run "talentflow screen" first.`
    );
  }

  const jobDescription = await parseJobDescription(jdPath);
  const ranked = await readJsonFile(resolvedCandidatesPath);
  const summary = summarize(ranked);

  const files = await writeReports(ranked, jobDescription, summary, resolvedOutputDir);
  logger.success(`Reports regenerated: ${Object.values(files).join(', ')}`);

  return { files, summary };
}
