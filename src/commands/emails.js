import path from 'node:path';
import { loadConfig } from '../config/config.js';
import { resolveProvider } from '../ai/resolveProvider.js';
import { readJsonFile, writeTextFile, ensureDir, pathExists, slugify } from '../utils/fileUtils.js';
import { parseJobDescription } from '../parser/jdParser.js';
import {
  EMAIL_TYPES,
  TONES,
  EMAIL_SYSTEM_PROMPT,
  buildEmailPrompt,
  fallbackEmail,
} from '../templates/emailTemplates.js';
import { logger } from '../utils/logger.js';

/**
 * `talentflow emails` — generates a recruiter email for every screened
 * candidate (or a specific status bucket) using the requested template
 * type and tone.
 */
export async function generateEmails({
  jdPath,
  candidatesPath,
  outputDir,
  type = 'interview-invitation',
  tone = 'formal',
  status,
  companyName,
  useAi,
} = {}) {
  if (!EMAIL_TYPES.includes(type)) {
    throw new Error(`Unknown email type "${type}". Supported: ${EMAIL_TYPES.join(', ')}`);
  }
  if (!TONES.includes(tone)) {
    throw new Error(`Unknown tone "${tone}". Supported: ${TONES.join(', ')}`);
  }

  const config = loadConfig();
  const resolvedOutputDir = outputDir || config.paths.output;
  const resolvedCandidatesPath = candidatesPath || path.join(resolvedOutputDir, 'candidates.json');
  const shouldUseAi = useAi ?? config.useAi;

  if (!(await pathExists(resolvedCandidatesPath))) {
    throw new Error(
      `No screened candidates found at ${resolvedCandidatesPath}. Run "talentflow screen" first.`
    );
  }

  const jobDescription = jdPath ? await parseJobDescription(jdPath) : null;
  let candidates = await readJsonFile(resolvedCandidatesPath);
  if (status) candidates = candidates.filter((c) => c.status === status);

  if (candidates.length === 0) {
    logger.warn('No matching candidates found for email generation.');
    return { emails: [] };
  }

  const provider = resolveProvider(config, shouldUseAi, 'AI email generation');

  const emailsDir = path.join(resolvedOutputDir, 'emails');
  await ensureDir(emailsDir);

  const emails = [];
  for (const candidate of candidates) {
    let email;
    if (provider) {
      try {
        const raw = await provider.complete({
          system: EMAIL_SYSTEM_PROMPT,
          prompt: buildEmailPrompt({ type, tone, candidate, jobDescription, companyName }),
          maxTokens: 500,
        });
        email = JSON.parse(
          raw
            .trim()
            .replace(/^```json/i, '')
            .replace(/^```/, '')
            .replace(/```$/, '')
        );
      } catch (error) {
        logger.warn(`AI email generation failed for ${candidate.name}, using fallback: ${error.message}`);
        email = fallbackEmail({ type, tone, candidate, jobDescription, companyName });
      }
    } else {
      email = fallbackEmail({ type, tone, candidate, jobDescription, companyName });
    }

    const fileName = `${slugify(candidate.name)}-${type}.md`;
    const filePath = path.join(emailsDir, fileName);
    await writeTextFile(
      filePath,
      `# ${email.subject}\n\nTo: ${candidate.name} <${candidate.email || 'unknown'}>\n\n---\n\n${email.body}\n`
    );
    logger.success(`Email drafted for ${candidate.name} (${type}) → ${filePath}`);
    emails.push({ candidate: candidate.name, filePath, ...email });
  }

  logger.info(`Generated ${emails.length} email(s) → ${emailsDir}`);
  return { emails, outputDir: emailsDir };
}
