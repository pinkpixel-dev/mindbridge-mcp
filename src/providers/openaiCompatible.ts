import OpenAI from 'openai';
import { GetSecondOpinionInput, LLMResponse, LLMError, OpenAICompatibleConfig } from '../types.js';
import { LLMProvider, handleProviderError, createSuccessResponse } from './base.js';

// Extended params type to include reasoning_effort and max_tokens
type ExtendedChatCompletionParams = OpenAI.Chat.ChatCompletionCreateParamsNonStreaming & {
  reasoning_effort?: string;
  max_tokens?: number;
};

export class OpenAICompatibleProvider implements LLMProvider {
  private client: OpenAI;
  private availableModels: string[];

  constructor(config: OpenAICompatibleConfig) {
    // Create OpenAI client with or without API key
    const clientOptions: any = {
      baseURL: config.baseUrl
    };

    // Add API key if provided
    if (config.apiKey) {
      clientOptions.apiKey = config.apiKey;
    } else {
      // If no API key is provided, use a dummy key as OpenAI SDK requires a non-empty string
      // The actual authentication might be handled by the service in other ways (e.g., IP-based)
      clientOptions.apiKey = 'dummy-key';
    }

    this.client = new OpenAI(clientOptions);
    this.availableModels = config.availableModels || [];
  }

  public supportsReasoningEffort(): boolean {
    return false; // By default, assume OpenAI-compatible endpoints don't support reasoning_effort
  }

  public supportsReasoningEffortForModel(_model: string): boolean {
    return false; // By default, assume OpenAI-compatible endpoints don't support reasoning_effort
  }

  public getAvailableModels(): string[] {
    return this.availableModels;
  }

  public isValidModel(model: string): boolean {
    // If no models are specified, assume all models are valid
    if (this.availableModels.length === 0) {
      return true;
    }
    return this.availableModels.includes(model);
  }

  public async getResponse(params: GetSecondOpinionInput): Promise<LLMResponse | LLMError> {
    try {
      // Prepare messages
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      // Add system prompt if provided
      if (params.systemPrompt) {
        messages.push({
          role: 'system',
          content: params.systemPrompt
        });
      }

      // Add user prompt
      messages.push({
        role: 'user',
        content: params.prompt
      });

      // Prepare request parameters
      const requestParams: ExtendedChatCompletionParams = {
        model: params.model,
        messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens
      };

      // Add optional parameters if provided
      if (params.top_p) {
        requestParams.top_p = params.top_p;
      }

      if (params.frequency_penalty) {
        requestParams.frequency_penalty = params.frequency_penalty;
      }

      if (params.presence_penalty) {
        requestParams.presence_penalty = params.presence_penalty;
      }

      if (params.stop_sequences) {
        requestParams.stop = params.stop_sequences;
      }

      // Make the API call
      const response = await this.client.chat.completions.create(requestParams);

      // Extract the response text
      const responseText = response.choices[0]?.message?.content;

      if (!responseText) {
        throw new Error('No response content received from OpenAI-compatible API');
      }

      return createSuccessResponse(responseText);
    } catch (error) {
      return handleProviderError(error, 'OpenAI-compatible API');
    }
  }
}
