import { LLMProvider } from './base.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { DeepSeekProvider } from './deepseek.js';
import { GoogleProvider } from './google.js';
import { OpenRouterProvider } from './openrouter.js';
import { OllamaProvider } from './ollama.js';
import { OpenAICompatibleProvider } from './openaiCompatible.js';
import { ServerConfig } from '../types.js';

export class ProviderFactory {
  private config: ServerConfig;
  private providers: Map<string, LLMProvider>;

  constructor(config: ServerConfig) {
    this.config = config;
    this.providers = new Map();

    // Initialize configured providers
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize OpenAI provider if configured
    if (this.config.openai) {
      this.providers.set('openai', new OpenAIProvider(this.config.openai));
    }

    // Initialize Anthropic provider if configured
    if (this.config.anthropic) {
      this.providers.set('anthropic', new AnthropicProvider(this.config.anthropic));
    }

    // Initialize DeepSeek provider if configured
    if (this.config.deepseek) {
      this.providers.set('deepseek', new DeepSeekProvider(this.config.deepseek));
    }

    // Initialize Google provider if configured
    if (this.config.google) {
      this.providers.set('google', new GoogleProvider(this.config.google));
    }

    // Initialize OpenRouter provider if configured
    if (this.config.openrouter) {
      this.providers.set('openrouter', new OpenRouterProvider(this.config.openrouter));
    }

    // Initialize Ollama provider if configured
    if (this.config.ollama) {
      this.providers.set('ollama', new OllamaProvider(this.config.ollama));
    }

    // Initialize OpenAI-compatible provider if configured
    if (this.config.openaiCompatible) {
      this.providers.set('openaiCompatible', new OpenAICompatibleProvider(this.config.openaiCompatible));
    }
  }

  public getProvider(providerName: string): LLMProvider | undefined {
    return this.providers.get(providerName.toLowerCase());
  }

  public hasProvider(providerName: string): boolean {
    return this.providers.has(providerName.toLowerCase());
  }

  public getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  public getAvailableModelsForProvider(providerName: string): string[] {
    const provider = this.getProvider(providerName);
    return provider ? provider.getAvailableModels() : [];
  }

  public supportsReasoningEffort(providerName: string): boolean {
    const provider = this.getProvider(providerName);
    return provider ? provider.supportsReasoningEffort() : false;
  }

  public isValidModelForProvider(providerName: string, modelName: string): boolean {
    const provider = this.getProvider(providerName);
    return provider ? provider.isValidModel(modelName) : false;
  }
}