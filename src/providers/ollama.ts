import { GetSecondOpinionInput, LLMResponse, LLMError, OllamaConfig } from '../types.js';
import { LLMProvider, handleProviderError, createSuccessResponse } from './base.js';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaErrorResponse {
  error: string;
  code?: number;
}

interface OllamaResponse {
  model: string;
  message?: {
    content: string;
  };
  response?: string;
  done: boolean;
}

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
  }>;
}

export class OllamaProvider implements LLMProvider {
  private baseUrl: string;

  constructor(config: OllamaConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash if present
  }

  public supportsReasoningEffort(): boolean {
    return false;
  }

  public supportsReasoningEffortForModel(_model: string): boolean {
    return false; // Ollama doesn't support reasoning_effort parameter
  }

  public getAvailableModels(): string[] {
    // Note: This is a static list of common models. In practice,
    // you would want to query the Ollama API for available models.
    return [
      'llama2',
      'mistral',
      'mixtral',
      'nous-hermes',
      'neural-chat',
      'vicuna',
      'codellama',
      'phi'
    ];
  }

  public isValidModel(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }

  private isOllamaError(obj: unknown): obj is OllamaErrorResponse {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'error' in obj &&
      typeof (obj as OllamaErrorResponse).error === 'string'
    );
  }

  private isOllamaTagsResponse(obj: unknown): obj is OllamaTagsResponse {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'models' in obj &&
      Array.isArray((obj as OllamaTagsResponse).models) &&
      (obj as OllamaTagsResponse).models.every(model =>
        typeof model === 'object' &&
        model !== null &&
        'name' in model &&
        typeof model.name === 'string'
      )
    );
  }

  private async fetchModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return this.getAvailableModels(); // Fall back to static list
      }
      const data = await response.json();

      if (this.isOllamaTagsResponse(data)) {
        return data.models.map(model => model.name);
      }

      return this.getAvailableModels(); // Fall back to static list
    } catch {
      return this.getAvailableModels(); // Fall back to static list on error
    }
  }

  public async getResponse(params: GetSecondOpinionInput): Promise<LLMResponse | LLMError> {
    try {
      const messages: OllamaMessage[] = [];

      // Add system prompt if provided
      if (params.systemPrompt) {
        messages.push({
          role: 'system',
          content: params.systemPrompt
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: params.prompt
      });

      // Ollama v0.1.18+ supports the OpenAI-style chat format
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: params.model,
          messages,
          options: {
            temperature: params.temperature,
            num_predict: params.maxTokens
          },
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          this.isOllamaError(errorData)
            ? errorData.error
            : 'Ollama request failed'
        );
      }

      const data = await response.json() as OllamaResponse;

      // Handle both chat and completion response formats
      const content = data.message?.content || data.response;

      if (!content) {
        throw new Error('No response content received from Ollama');
      }

      return createSuccessResponse(content);
    } catch (error) {
      return handleProviderError(error, 'Ollama');
    }
  }
}