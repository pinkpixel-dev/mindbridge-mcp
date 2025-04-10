export * from './base.js';
export * from './openai.js';
export * from './anthropic.js';
export * from './deepseek.js';
export * from './google.js';
export * from './openrouter.js';
export * from './ollama.js';
export * from './openaiCompatible.js';
export * from './factory.js';

// Export provider names as constants
export const PROVIDER_NAMES = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  DEEPSEEK: 'deepseek',
  GOOGLE: 'google',
  OPENROUTER: 'openrouter',
  OLLAMA: 'ollama'
} as const;

export type ProviderName = typeof PROVIDER_NAMES[keyof typeof PROVIDER_NAMES];

// Export model constants for each provider
export const MODEL_NAMES = {
  OPENAI: {
    GPT4O: 'gpt-4o',
    GPT4O_MINI: 'gpt-4o-mini',
    O1: 'o1',
    O1_MINI: 'o1-mini',
    O3: 'o3',
    O3_MINI: 'o3-mini',
    GPT45: 'gpt-4.5'
  },
  ANTHROPIC: {
    CLAUDE_37_SONNET: 'claude-3-7-sonnet-20250219',
    CLAUDE_35_SONNET: 'claude-3-5-sonnet-20241022',
    CLAUDE_35_HAIKU: 'claude-3-5-haiku-20241022',
    CLAUDE_3_OPUS: 'claude-3-opus-20240229',
    CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
    CLAUDE_3_HAIKU: 'claude-3-haiku-20240307'
  },
  DEEPSEEK: {
    CHAT: 'deepseek-chat',
    CODER: 'deepseek-coder',
    REASONER: 'deepseek-reasoner'
  },
  GOOGLE: {
    GEMINI_15_PRO: 'gemini-1.5-pro',
    GEMINI_15_FLASH: 'gemini-1.5-flash',
    GEMINI_10_PRO: 'gemini-1.0-pro',
    GEMINI_10_PRO_VISION: 'gemini-1.0-pro-vision',
    GEMINI_20_FLASH: 'gemini-2.0-flash',
    GEMINI_20_FLASH_THINKING: 'gemini-2.0-flash-thinking-exp'
  },
  // For OpenRouter and Ollama, we provide some common models as examples,
  // but users can specify any model supported by these services
  OPENROUTER: {
    // Examples of popular models
    OPENAI_GPT4O: 'openai/gpt-4o',
    ANTHROPIC_CLAUDE_3_OPUS: 'anthropic/claude-3-opus',
    ANTHROPIC_CLAUDE_3_SONNET: 'anthropic/claude-3-sonnet',
    GOOGLE_GEMINI_PRO: 'google/gemini-pro',
    META_LLAMA3: 'meta/llama-3',
    MISTRAL_MEDIUM: 'mistral/mistral-medium'
  },
  OLLAMA: {
    // Examples of common models
    LLAMA2: 'llama2',
    LLAMA3: 'llama3',
    MISTRAL: 'mistral',
    MIXTRAL: 'mixtral',
    CODELLAMA: 'codellama',
    VICUNA: 'vicuna',
    PHI: 'phi'
  }
} as const;

// Export available reasoning models
export const REASONING_MODELS = [
  MODEL_NAMES.OPENAI.O1,
  MODEL_NAMES.OPENAI.O3_MINI,
  MODEL_NAMES.DEEPSEEK.REASONER,
  MODEL_NAMES.ANTHROPIC.CLAUDE_37_SONNET
] as const;

export type ReasoningEffort = 'low' | 'medium' | 'high';