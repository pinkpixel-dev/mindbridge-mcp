import * as dotenv from 'dotenv';
import { ServerConfig } from './types.js';

// Load environment variables
dotenv.config();

function getEnvVar(name: string): string | undefined {
  return process.env[name];
}

function getBaseUrl(name: string, defaultUrl?: string): string {
  const url = getEnvVar(name);
  return url || defaultUrl || 'http://localhost:11434'; // Fallback for Ollama
}

// Load and validate server configuration
export function loadConfig(): ServerConfig {
  const config: ServerConfig = {};

  // OpenAI Configuration
  const openaiKey = getEnvVar('OPENAI_API_KEY');
  if (openaiKey) {
    config.openai = {
      apiKey: openaiKey,
      baseUrl: 'https://api.openai.com/v1' // Fixed endpoint
    };
  }

  // Anthropic Configuration
  const anthropicKey = getEnvVar('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    config.anthropic = {
      apiKey: anthropicKey,
      baseUrl: 'https://api.anthropic.com' // Fixed endpoint
    };
  }

  // DeepSeek Configuration
  const deepseekKey = getEnvVar('DEEPSEEK_API_KEY');
  if (deepseekKey) {
    config.deepseek = {
      apiKey: deepseekKey,
      baseUrl: getBaseUrl('DEEPSEEK_API_BASE_URL', 'https://api.deepseek.com')
    };
  }

  // Google Configuration
  const googleKey = getEnvVar('GOOGLE_API_KEY');
  if (googleKey) {
    config.google = {
      apiKey: googleKey,
      baseUrl: getBaseUrl('GOOGLE_API_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta')
    };
  }

  // OpenRouter Configuration
  const openrouterKey = getEnvVar('OPENROUTER_API_KEY');
  if (openrouterKey) {
    config.openrouter = {
      apiKey: openrouterKey
    };
  }

  // OpenAI-Compatible API Configuration
  const openaiCompatibleBaseUrl = getEnvVar('OPENAI_COMPATIBLE_API_BASE_URL');
  // Only the base URL is required, API key is optional
  if (openaiCompatibleBaseUrl) {
    const openaiCompatibleKey = getEnvVar('OPENAI_COMPATIBLE_API_KEY');
    // Parse available models if provided
    const modelsStr = getEnvVar('OPENAI_COMPATIBLE_API_MODELS');
    const availableModels = modelsStr ? modelsStr.split(',').map(m => m.trim()) : [];

    config.openaiCompatible = {
      apiKey: openaiCompatibleKey || undefined, // Use undefined if no key is provided
      baseUrl: openaiCompatibleBaseUrl,
      availableModels
    };
  }

  // Ollama Configuration
  config.ollama = {
    baseUrl: getBaseUrl('OLLAMA_BASE_URL', 'http://localhost:11434')
  };

  return config;
}

// Get configuration for a specific provider
export function getProviderConfig<T extends keyof ServerConfig>(
  config: ServerConfig,
  provider: T
): ServerConfig[T] | undefined {
  return config[provider];
}

// Check if a provider is configured
export function isProviderConfigured(
  config: ServerConfig,
  provider: keyof ServerConfig
): boolean {
  return !!config[provider];
}