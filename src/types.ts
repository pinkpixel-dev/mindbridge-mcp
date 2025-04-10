import { z } from 'zod';

// Provider types
export const LLMProvider = z.enum([
  'openai',
  'anthropic',
  'deepseek',
  'google',
  'openrouter',
  'ollama',
  'openaiCompatible'
]);
export type LLMProvider = z.infer<typeof LLMProvider>;

// Input schema for the getSecondOpinion tool
export const GetSecondOpinionSchema = z.object({
  prompt: z.string().min(1),
  provider: LLMProvider,
  model: z.string().min(1),
  systemPrompt: z.string().optional().nullable(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().positive().optional().default(1024),
  reasoning_effort: z.union([ // Primarily for OpenAI o-series
    z.literal('low'),
    z.literal('medium'),
    z.literal('high')
  ]).optional().nullable(),
  // Add other potential parameters if needed based on updated APIs
  top_p: z.number().min(0).max(1).optional(),
  top_k: z.number().positive().optional(),
  stop_sequences: z.array(z.string()).optional(),
  stream: z.boolean().optional(), // For Google Gemini
  frequency_penalty: z.number().min(-2.0).max(2.0).optional(), // For OpenAI
  presence_penalty: z.number().min(-2.0).max(2.0).optional() // For OpenAI
});

export type GetSecondOpinionInput = z.infer<typeof GetSecondOpinionSchema>;

// Configuration interfaces for each provider
export interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface AnthropicConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface GoogleConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface OpenRouterConfig {
  apiKey: string;
}

export interface OllamaConfig {
  baseUrl: string;
}

export interface OpenAICompatibleConfig {
  apiKey?: string; // Optional: Some services don't require an API key
  baseUrl: string;
  availableModels?: string[];
}

// Server configuration interface
export interface ServerConfig {
  openai?: OpenAIConfig;
  anthropic?: AnthropicConfig;
  deepseek?: DeepSeekConfig;
  google?: GoogleConfig;
  openrouter?: OpenRouterConfig;
  ollama?: OllamaConfig;
  openaiCompatible?: OpenAICompatibleConfig;
}

// Error types
export interface LLMError {
  isError: true;
  content: { type: 'text'; text: string }[];
}

// Response types
export interface LLMResponse {
  isError: false;
  content: { type: 'text'; text: string }[];
}