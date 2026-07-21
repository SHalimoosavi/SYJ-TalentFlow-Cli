import { createProvider } from './providerFactory.js';
import { logger } from '../utils/logger.js';

/**
 * Resolves the configured AI provider, or returns null with a single
 * clear warning if AI is disabled or no API key is configured. Used by
 * every command so a missing key degrades gracefully to fallback
 * behaviour instead of failing noisily once per candidate.
 */
export function resolveProvider(config, shouldUseAi, context = 'AI features') {
  if (!shouldUseAi) return null;
  try {
    const provider = createProvider(config);
    if (!provider.apiKey) {
      logger.warn(
        `No API key found for "${config.aiProvider}" — ${context} will use fallback (non-AI) behavior. ` +
          'Run "talentflow config --init" to add one.'
      );
      return null;
    }
    return provider;
  } catch (error) {
    logger.warn(`${context} disabled — ${error.message}`);
    return null;
  }
}
