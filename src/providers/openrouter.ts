import { GetSecondOpinionInput, LLMResponse, LLMError, OpenRouterConfig } from '../types.js';
import { LLMProvider, handleProviderError, createSuccessResponse } from './base.js';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenRouterProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  public supportsReasoningEffort(): boolean {
    return false;
  }

  public supportsReasoningEffortForModel(_model: string): boolean {
    return false; // OpenRouter doesn't support reasoning_effort parameter
  }

  public getAvailableModels(): string[] {
    return [
      'openai/gpt-4-turbo-preview',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-opus',
      'google/gemini-pro',
      'meta/llama-3',
      'mistral/mistral-medium'
    ];
  }

  public isValidModel(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }

  private isOpenRouterError(obj: unknown): obj is OpenRouterErrorResponse {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'error' in obj &&
      typeof (obj as OpenRouterErrorResponse).error === 'object' &&
      'message' in (obj as OpenRouterErrorResponse).error
    );
  }

  public async getResponse(params: GetSecondOpinionInput): Promise<LLMResponse | LLMError> {
    try {
      const messages: OpenRouterMessage[] = [];

      if (params.systemPrompt) {
        messages.push({
          role: 'system',
          content: params.systemPrompt
        });
      }

      messages.push({
        role: 'user',
        content: params.prompt
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://pinkpixel.dev',
          'X-Title': 'SecondOpinion MCP'
        },
        body: JSON.stringify({
          model: params.model,
          messages,
          temperature: params.temperature,
          max_tokens: params.maxTokens,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          this.isOpenRouterError(errorData)
            ? errorData.error.message
            : 'OpenRouter request failed'
        );
      }

      const data = await response.json() as OpenRouterResponse;

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('No response received from OpenRouter');
      }

      return createSuccessResponse(data.choices[0].message.content);
    } catch (error) {
      return handleProviderError(error, 'OpenRouter');
    }
  }
}