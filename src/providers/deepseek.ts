import { GetSecondOpinionInput, LLMResponse, LLMError, DeepSeekConfig } from '../types.js';
import { LLMProvider, handleProviderError, createSuccessResponse } from './base.js';

// Custom interfaces for DeepSeek API responses
interface DeepSeekMessage {
  role: string;
  content: string;
}

interface DeepSeekErrorResponse {
  message: string;
}

interface DeepSeekChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class DeepSeekProvider implements LLMProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: DeepSeekConfig) {
    this.baseUrl = config.baseUrl || 'https://api.deepseek.com';
    this.apiKey = config.apiKey;
  }

  public supportsReasoningEffort(): boolean {
    return true; // DeepSeek supports reasoning through the deepseek-reasoner model
  }

  public supportsReasoningEffortForModel(model: string): boolean {
    return model === 'deepseek-reasoner'; // Only the reasoner model supports Chain of Thought reasoning
  }

  public getAvailableModels(): string[] {
    return [
      'deepseek-chat', // V3 and V2.5 alias
      'deepseek-coder', // V2.5 alias
      'deepseek-reasoner' // R1
    ];
  }

  public isValidModel(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }

  private isDeepSeekErrorResponse(obj: unknown): obj is DeepSeekErrorResponse {
    return typeof obj === 'object' &&
           obj !== null &&
           'message' in obj &&
           typeof (obj as DeepSeekErrorResponse).message === 'string';
  }

  public async getResponse(params: GetSecondOpinionInput): Promise<LLMResponse | LLMError> {
    try {
      // Prepare messages
      const messages: DeepSeekMessage[] = [];

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

      // Prepare request body
      const requestBody: any = {
        model: params.model,
        messages,
        // Standard parameters apply to all models
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      };

      // For the reasoner model, add a special prompt to extract the Chain of Thought
      if (this.supportsReasoningEffortForModel(params.model) && params.reasoning_effort) {
        // Add a system message to encourage detailed reasoning based on the reasoning_effort level
        const reasoningDepth = params.reasoning_effort === 'high' ? 'extremely detailed' :
                              params.reasoning_effort === 'medium' ? 'detailed' : 'brief';

        // Insert a system message at the beginning to encourage Chain of Thought reasoning
        messages.unshift({
          role: 'system',
          content: `Please provide ${reasoningDepth} step-by-step reasoning before giving your final answer. Start with "Reasoning:" and end with "Answer:" to clearly separate your thought process from your final response.`
        });

        // Update the messages in the request body
        requestBody.messages = messages;
      }

      // Make sure we're using the correct endpoint format
      const apiEndpoint = `${this.baseUrl}/v1/chat/completions`;
      console.log(`Sending request to DeepSeek API: ${apiEndpoint}`);
      console.log('Request body:', JSON.stringify(requestBody));

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        // Log response status and headers for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()])));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('DeepSeek API error response:', errorText);

          try {
            const errorData = JSON.parse(errorText);
            const errorMessage = this.isDeepSeekErrorResponse(errorData)
              ? errorData.message
              : `DeepSeek API request failed: ${errorText}`;
            throw new Error(errorMessage);
          } catch (jsonError) {
            throw new Error(`DeepSeek API request failed with status ${response.status}: ${errorText}`);
          }
        }

        const responseText = await response.text();
        console.log('DeepSeek API response:', responseText);

        const data = JSON.parse(responseText) as DeepSeekChatResponse;

        if (!data.choices?.[0]?.message?.content) {
          throw new Error('No response content received from DeepSeek');
        }

        const content = data.choices[0].message.content;

        // For the reasoner model, format the response to highlight the reasoning process
        if (this.supportsReasoningEffortForModel(params.model)) {
          // Check if the response follows our requested format with "Reasoning:" and "Answer:"
          const reasoningMatch = content.match(/Reasoning:(.*?)Answer:(.*)/s);

          if (reasoningMatch) {
            const reasoning = reasoningMatch[1].trim();
            const answer = reasoningMatch[2].trim();

            // Format the response to clearly show the reasoning and answer
            return createSuccessResponse(`Chain of Thought Reasoning:\n${reasoning}\n\nFinal Answer:\n${answer}`);
          }
        }

        // For regular responses or if the format doesn't match
        return createSuccessResponse(content);
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(`DeepSeek API fetch failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }
    } catch (error) {
      return handleProviderError(error, 'DeepSeek');
    }
  }
}
