import OpenAI from 'openai';
import { GetSecondOpinionInput, LLMResponse, LLMError, OpenAIConfig } from '../types.js';
import { LLMProvider, handleProviderError, createSuccessResponse } from './base.js';

const REASONING_MODELS = ['o1', 'o1-mini', 'o3', 'o3-mini'];

// Custom type for OpenAI's reasoning effort parameter
type ReasoningEffort = 'low' | 'medium' | 'high';

// Extended params type to include reasoning_effort and max_completion_tokens
type ExtendedChatCompletionParams = OpenAI.Chat.ChatCompletionCreateParamsNonStreaming & {
  reasoning_effort?: ReasoningEffort;
  max_tokens?: number;
  max_completion_tokens?: number;
};

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl
    });
  }

  public supportsReasoningEffort(): boolean {
    return true;
  }

  public supportsReasoningEffortForModel(model: string): boolean {
    // Only o1 and o3 models support reasoning_effort parameter, not o1-mini
    return model === 'o1' || model === 'o3-mini';
  }

  public getAvailableModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'o1',
      'o1-mini',
      'o3',
      'o3-mini',
      'gpt-4.5' // Ensure all latest models are listed
    ];
  }

  public isValidModel(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }

  private convertReasoningEffort(
    effort: string | number | null | undefined
  ): ReasoningEffort {
    if (!effort) return 'medium';
    if (typeof effort === 'number') return 'medium';

    const validEfforts: ReasoningEffort[] = ['low', 'medium', 'high'];
    return validEfforts.includes(effort as ReasoningEffort)
      ? (effort as ReasoningEffort)
      : 'medium';
  }

  public async getResponse(params: GetSecondOpinionInput): Promise<LLMResponse | LLMError> {
    try {
      const isReasoningModel = REASONING_MODELS.includes(params.model);

      // Build messages array
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (params.systemPrompt) {
        messages.push({ role: 'system', content: params.systemPrompt });
      }
      messages.push({ role: 'user', content: params.prompt });

      // Prepare request parameters
      const requestParams: ExtendedChatCompletionParams = {
        model: params.model,
        messages,
        stream: false
      };

      // Add model-specific parameters
      if (isReasoningModel) {
        // For o-series models, use reasoning_effort and max_completion_tokens
        requestParams.reasoning_effort = this.convertReasoningEffort(params.reasoning_effort);

        // o-series models use max_completion_tokens instead of max_tokens
        if (params.maxTokens) {
          requestParams.max_completion_tokens = params.maxTokens;
        }

        // o-series models don't support temperature parameter
        // temperature, top_p and n are fixed at 1, while presence_penalty and frequency_penalty are fixed at 0
      } else {
        // For non-o-series models, use temperature and max_tokens
        if (params.temperature !== undefined) {
          requestParams.temperature = params.temperature;
        }

        if (params.maxTokens) {
          requestParams.max_tokens = params.maxTokens;
        }
      }

      // Create completion with type assertion to handle reasoning_effort
      const completion = await this.client.chat.completions.create(
        requestParams as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming
      );

      if (!completion.choices[0]?.message?.content) {
        throw new Error('No response received from OpenAI');
      }

      return createSuccessResponse(completion.choices[0].message.content);
    } catch (error) {
      return handleProviderError(error, 'OpenAI');
    }
  }
}