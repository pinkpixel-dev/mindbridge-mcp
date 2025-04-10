import Anthropic from '@anthropic-ai/sdk';
import { GetSecondOpinionInput, LLMResponse, LLMError, AnthropicConfig } from '../types.js';
import { LLMProvider, handleProviderError, createSuccessResponse } from './base.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl
    });
  }

  public supportsReasoningEffort(): boolean {
    return true; // Claude 3.7 Sonnet supports extended thinking
  }

  public supportsReasoningEffortForModel(model: string): boolean {
    return model === 'claude-3-7-sonnet-20250219';
  }

  public getAvailableModels(): string[] {
    return [
      'claude-3-7-sonnet-20250219', // Latest model with extended thinking support
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }

  public isValidModel(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }

  public async getResponse(params: GetSecondOpinionInput): Promise<LLMResponse | LLMError> {
    try {
      // For Claude 3, we need to combine system prompt and user prompt
      const fullPrompt = params.systemPrompt
        ? `${params.systemPrompt}\n\n${params.prompt}`
        : params.prompt;

      // Base message creation parameters
      const messageParams: any = {
        model: params.model,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens
      };

      // Add thinking parameter for Claude 3.7 Sonnet if reasoning_effort is specified
      if (this.supportsReasoningEffortForModel(params.model) && params.reasoning_effort) {
        // Map reasoning_effort to budget_tokens
        let budgetTokens = 16000; // Default to medium

        if (params.reasoning_effort === 'low') {
          budgetTokens = 4000;
        } else if (params.reasoning_effort === 'high') {
          budgetTokens = 32000;
        }

        // Add thinking parameter
        messageParams.thinking = {
          type: 'enabled',
          budget_tokens: budgetTokens
        };

        // When thinking is enabled, temperature, top_p, and top_k are not compatible
        // Remove these parameters if they exist
        delete messageParams.temperature;
        delete messageParams.top_p;
        delete messageParams.top_k;
      }

      const completion = await this.client.messages.create(messageParams);

      // Process response content
      // First, extract thinking blocks if any
      const thinkingBlocks = completion.content
        .filter((block: any) => block.type === 'thinking' || block.type === 'redacted_thinking')
        .map((block: any) => {
          if (block.type === 'thinking') {
            return `Thinking: ${block.thinking}`;
          } else {
            return 'Redacted thinking: [Content redacted for safety]';
          }
        });

      // Then extract text blocks
      const textBlocks = completion.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text);

      // Combine all content
      const allContent = [...thinkingBlocks, ...textBlocks];
      const textContent = allContent.join('\n\n');

      if (!textContent) {
        throw new Error('No text response received from Anthropic');
      }

      return createSuccessResponse(textContent);
    } catch (error) {
      return handleProviderError(error, 'Anthropic');
    }
  }
}