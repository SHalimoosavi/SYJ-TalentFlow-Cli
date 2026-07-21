import { AIProvider } from './AIProvider.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export class AnthropicProvider extends AIProvider {
  async complete({ system, prompt, maxTokens = 1024 }) {
    this.assertApiKey('ANTHROPIC_API_KEY');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        temperature: this.temperature,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Anthropic API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find((block) => block.type === 'text');
    return textBlock?.text ?? '';
  }
}
