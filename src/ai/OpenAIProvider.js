import { AIProvider } from './AIProvider.js';

const API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIProvider extends AIProvider {
  async complete({ system, prompt, maxTokens = 1024 }) {
    this.assertApiKey('OPENAI_API_KEY');

    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
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
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  }
}
