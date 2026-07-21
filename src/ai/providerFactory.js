import { AnthropicProvider } from './AnthropicProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { OpenRouterProvider } from './OpenRouterProvider.js';

/**
 * Maps a provider key (from AI_PROVIDER) to its implementation class.
 * Adding a new provider is a two-step change:
 *   1. Create src/ai/YourProvider.js extending AIProvider.
 *   2. Register it here.
 * No other file needs to know it exists.
 */
const PROVIDERS = {
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
  openrouter: OpenRouterProvider,
};

export function createProvider(config) {
  const key = config.aiProvider?.toLowerCase();
  const ProviderClass = PROVIDERS[key];

  if (!ProviderClass) {
    throw new Error(
      `Unknown AI_PROVIDER "${config.aiProvider}". Supported providers: ${Object.keys(PROVIDERS).join(', ')}.`
    );
  }

  return new ProviderClass({
    apiKey: config.apiKeys[key],
    model: config.model,
    temperature: config.temperature,
  });
}

export function listProviderNames() {
  return Object.keys(PROVIDERS);
}
