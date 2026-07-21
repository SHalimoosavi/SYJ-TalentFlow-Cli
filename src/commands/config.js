import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import { loadConfig } from '../config/config.js';
import { listProviderNames } from '../ai/providerFactory.js';
import { logger } from '../utils/logger.js';

const ENV_KEYS = [
  'AI_PROVIDER',
  'MODEL',
  'TEMPERATURE',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENROUTER_API_KEY',
];

/**
 * `talentflow config` — shows the active (non-secret) configuration, or
 * with --init walks the user through creating a local .env file.
 */
export async function runConfigCommand({ init = false, cwd = process.cwd() } = {}) {
  if (init) return initConfig(cwd);

  const config = loadConfig({ reload: true });
  logger.title('Current TalentFlow Configuration');
  logger.info(`AI provider:      ${config.aiProvider}`);
  logger.info(`Model:            ${config.model}`);
  logger.info(`Temperature:      ${config.temperature}`);
  logger.info(`Resumes dir:      ${config.paths.resumes}`);
  logger.info(`Jobs dir:         ${config.paths.jobs}`);
  logger.info(`Output dir:       ${config.paths.output}`);
  logger.info(`Shortlist ≥:      ${config.scoring.shortlistThreshold}%`);
  logger.info(`Review ≥:         ${config.scoring.reviewThreshold}%`);
  logger.blank();
  logger.info(
    `API key present:  openai=${Boolean(config.apiKeys.openai)} anthropic=${Boolean(
      config.apiKeys.anthropic
    )} openrouter=${Boolean(config.apiKeys.openrouter)}`
  );
  logger.blank();
  logger.dim('Run "talentflow config --init" to create or update your .env file interactively.');
  return config;
}

async function initConfig(cwd) {
  const envPath = path.join(cwd, '.env');
  const existing = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';

  const answers = await prompts([
    {
      type: 'select',
      name: 'aiProvider',
      message: 'Which AI provider would you like to use?',
      choices: listProviderNames().map((p) => ({ title: p, value: p })),
    },
    {
      type: 'text',
      name: 'model',
      message: 'Model name (leave blank for provider default)',
    },
    {
      type: 'password',
      name: 'apiKey',
      message: (prev, values) => `API key for ${values.aiProvider}`,
    },
    {
      type: 'number',
      name: 'temperature',
      message: 'Temperature (0-1)',
      initial: 0.3,
    },
  ]);

  if (!answers.aiProvider) {
    logger.warn('Config init cancelled.');
    return null;
  }

  const keyVarName = `${answers.aiProvider.toUpperCase()}_API_KEY`;
  const lines = new Map(
    existing
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split('=');
        return [key, rest.join('=')];
      })
  );

  lines.set('AI_PROVIDER', answers.aiProvider);
  if (answers.model) lines.set('MODEL', answers.model);
  if (answers.temperature != null) lines.set('TEMPERATURE', String(answers.temperature));
  if (answers.apiKey) lines.set(keyVarName, answers.apiKey);

  const output = [...ENV_KEYS, ...[...lines.keys()].filter((k) => !ENV_KEYS.includes(k))]
    .filter((key) => lines.has(key))
    .map((key) => `${key}=${lines.get(key)}`)
    .join('\n');

  writeFileSync(envPath, `${output}\n`, 'utf-8');
  logger.success(`Saved configuration to ${envPath}`);
  logger.warn('Remember: .env is git-ignored by default. Never commit API keys.');
  return envPath;
}
