import process from 'node:process';
import { loadConfig } from '../config/config.js';
import { createProvider, listProviderNames } from '../ai/providerFactory.js';
import { pathExists } from '../utils/fileUtils.js';
import { logger } from '../utils/logger.js';

/**
 * `talentflow doctor` — sanity-checks the local environment: Node.js
 * version, directory layout, and AI provider configuration. Never makes
 * a network call, so it's safe to run offline (e.g. inside Termux
 * without data).
 */
export async function runDoctor() {
  logger.title('TalentFlow Doctor');
  const checks = [];

  const nodeVersion = process.versions.node;
  const majorVersion = Number(nodeVersion.split('.')[0]);
  checks.push({
    label: 'Node.js version',
    ok: majorVersion >= 22,
    detail: `v${nodeVersion} (requires >=22)`,
  });

  const config = loadConfig({ reload: true });

  checks.push({
    label: 'AI_PROVIDER value',
    ok: listProviderNames().includes(config.aiProvider),
    detail: config.aiProvider,
  });

  let providerKeyOk = false;
  let providerDetail = 'not checked';
  try {
    const provider = createProvider(config);
    providerKeyOk = Boolean(provider.apiKey);
    providerDetail = providerKeyOk ? `${provider.name} API key present` : `${provider.name} API key missing`;
  } catch (error) {
    providerDetail = error.message;
  }
  checks.push({ label: 'AI provider credentials', ok: providerKeyOk, detail: providerDetail });

  for (const [label, dir] of Object.entries(config.paths)) {
    const exists = await pathExists(dir);
    checks.push({
      label: `${label} directory ("${dir}")`,
      ok: exists,
      detail: exists ? 'found' : 'missing (will be created on demand)',
    });
  }

  for (const check of checks) {
    if (check.ok) logger.success(`${check.label} — ${check.detail}`);
    else logger.warn(`${check.label} — ${check.detail}`);
  }

  logger.blank();
  const failed = checks.filter((c) => !c.ok && c.label.includes('Node'));
  if (failed.length) {
    logger.error('TalentFlow requires Node.js 22 or newer.');
  } else {
    logger.info('Environment looks good. Run "talentflow screen --jd <jd> --resumes <dir>" to get started.');
  }

  return checks;
}
