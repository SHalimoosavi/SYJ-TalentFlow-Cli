/**
 * Base class every AI provider implements. Keeping this contract tiny —
 * a single `complete()` method — is what makes it cheap to add a new
 * provider (see CONTRIBUTING.md for the checklist).
 */
export class AIProvider {
  /**
   * @param {{ apiKey: string, model: string, temperature: number }} options
   */
  constructor({ apiKey, model, temperature } = {}) {
    if (new.target === AIProvider) {
      throw new Error('AIProvider is abstract and cannot be instantiated directly.');
    }
    this.apiKey = apiKey;
    this.model = model;
    this.temperature = temperature ?? 0.3;
  }

  /** Human-readable provider name, used in logs and `talentflow doctor`. */
  get name() {
    return this.constructor.name;
  }

  /**
   * @param {{ system?: string, prompt: string, maxTokens?: number }} args
   * @returns {Promise<string>} raw text completion
   */
  // eslint-disable-next-line no-unused-vars
  async complete(args) {
    throw new Error(`${this.name} must implement complete()`);
  }

  assertApiKey(envVarName) {
    if (!this.apiKey) {
      throw new Error(
        `${this.name} is selected but ${envVarName} is not set. Add it to your .env file or run "talentflow config".`
      );
    }
  }
}
