import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

/**
 * Loads TalentFlow configuration from environment variables (and a local
 * .env file, if present). Nothing here ever hardcodes a secret — every
 * credential must come from the environment.
 */
let cached = null;

function loadDotEnv(cwd) {
  const envPath = path.join(cwd, '.env');
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function loadConfig({ cwd = process.cwd(), reload = false } = {}) {
  if (cached && !reload) return cached;

  loadDotEnv(cwd);

  const config = {
    aiProvider: (process.env.AI_PROVIDER || 'anthropic').toLowerCase(),
    model: process.env.MODEL || defaultModelFor(process.env.AI_PROVIDER),
    temperature: toNumber(process.env.TEMPERATURE, 0.3),
    apiKeys: {
      openai: process.env.OPENAI_API_KEY || '',
      anthropic: process.env.ANTHROPIC_API_KEY || '',
      openrouter: process.env.OPENROUTER_API_KEY || '',
    },
    scoring: {
      skillsWeight: toNumber(process.env.TALENTFLOW_SKILLS_WEIGHT, 0.5),
      experienceWeight: toNumber(process.env.TALENTFLOW_EXPERIENCE_WEIGHT, 0.3),
      keywordWeight: toNumber(process.env.TALENTFLOW_KEYWORD_WEIGHT, 0.2),
      shortlistThreshold: toNumber(process.env.TALENTFLOW_SHORTLIST_THRESHOLD, 75),
      reviewThreshold: toNumber(process.env.TALENTFLOW_REVIEW_THRESHOLD, 50),
    },
    paths: {
      resumes: process.env.TALENTFLOW_RESUMES_DIR || 'resumes',
      jobs: process.env.TALENTFLOW_JOBS_DIR || 'jobs',
      output: process.env.TALENTFLOW_OUTPUT_DIR || 'output',
    },
    useAi: process.env.TALENTFLOW_USE_AI !== 'false',
  };

  cached = config;
  return config;
}

function defaultModelFor(provider) {
  switch ((provider || '').toLowerCase()) {
    case 'openai':
      return 'gpt-4o-mini';
    case 'openrouter':
      return 'openrouter/auto';
    case 'anthropic':
    default:
      return 'claude-sonnet-4-6';
  }
}

export function readPackageVersion() {
  try {
    const pkgPath = new URL('../../package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}
