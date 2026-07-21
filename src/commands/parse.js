import path from 'node:path';
import { loadConfig } from '../config/config.js';
import { parseResumeDirectory } from '../parser/resumeParser.js';
import { ensureDir, pathExists } from '../utils/fileUtils.js';
import { logger } from '../utils/logger.js';

/**
 * `talentflow parse` — parses every supported resume in a folder into
 * normalized JSON under <output>/parsed/.
 */
export async function parseResumes({ resumesDir, outputDir } = {}) {
  const config = loadConfig();
  const resolvedResumesDir = resumesDir || config.paths.resumes;
  const resolvedOutputDir = path.join(outputDir || config.paths.output, 'parsed');

  if (!(await pathExists(resolvedResumesDir))) {
    throw new Error(`Resumes directory not found: ${resolvedResumesDir}`);
  }

  await ensureDir(resolvedOutputDir);

  logger.step(`Parsing resumes from ${resolvedResumesDir}`);

  const failures = [];
  const results = await parseResumeDirectory(resolvedResumesDir, {
    outputDir: resolvedOutputDir,
    onFile: ({ file, ok, error }) => {
      if (ok) {
        logger.success(`Parsed ${path.basename(file)}`);
      } else {
        logger.warn(`Skipped ${path.basename(file)}: ${error.message}`);
        failures.push({ file, error: error.message });
      }
    },
  });

  logger.blank();
  logger.info(`Parsed ${results.length} resume(s) → ${resolvedOutputDir}`);
  if (failures.length) {
    logger.warn(`${failures.length} file(s) could not be parsed.`);
  }

  return { parsed: results, failures, outputDir: resolvedOutputDir };
}
