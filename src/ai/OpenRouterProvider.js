import { AIProvider } from './AIProvider.js';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterProvider extends AIProvider {
  async complete({ system, prompt, maxTokens = 1024 }) {
    this.assertApiKey('OPENROUTER_API_KEY');

    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://github.com/SHalimoosavi/talentflow-cli',
        'X-Title': 'TalentFlow CLI',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature: this.temperature,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  }
}
