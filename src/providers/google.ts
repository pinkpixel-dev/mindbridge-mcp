import { GetSecondOpinionInput, LLMResponse, LLMError, GoogleConfig } from '../types.js';
import { LLMProvider, handleProviderError, createSuccessResponse } from './base.js';
import * as fs from 'fs';

// Custom interfaces for Google AI API responses
// Note: We're using 'any' for flexibility with the Gemini API format

interface GoogleAIError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

interface GoogleAIChatResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    totalTokenCount?: number;
    promptTokensDetails?: Array<{
      modality?: string;
      tokenCount?: number;
    }>;
  };
  modelVersion?: string;
}

/**
 * Google Gemini Provider
 *
 * Note: Gemini 2.5 models (gemini-2.5-pro-exp-03-25, gemini-2.5-pro-preview-03-25) are currently
 * not fully supported through the REST API. They return a 200 status code but no content.
 * For best results with these models, use the @google/genai library directly.
 */
export class GoogleProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: GoogleConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  public supportsReasoningEffort(): boolean {
    return true; // Gemini models support reasoning effort
  }

  public supportsReasoningEffortForModel(_model: string): boolean {
    // All Gemini models support reasoning through prompting
    // They don't return the thinking process in the API response, but they do reason internally
    return true;
  }

  public getAvailableModels(): string[] {
    return [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'gemini-1.0-pro-vision',
      'gemini-2.0-flash',
      'gemini-2.0-flash-thinking-exp'
      // Temporarily removed until we figure out how to get responses from them
      // 'gemini-2.5-pro-preview-03-25',
      // 'gemini-2.5-pro-exp-03-25'  // Free experimental model
    ];
  }

  public isValidModel(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }

  private isGoogleAIError(obj: unknown): obj is GoogleAIError {
    return typeof obj === 'object' &&
           obj !== null &&
           'error' in obj &&
           typeof (obj as GoogleAIError).error === 'object' &&
           'message' in (obj as GoogleAIError).error;
  }

  private async generateGeminiResponse(
    model: string,
    prompt: string,
    systemPrompt: string | undefined,
    temperature: number | undefined,
    maxTokens: number | undefined,
    reasoningEffort?: string
  ): Promise<string> {
    // Store the model name for error handling
    const modelName = model;
    // Prepare the request body
    let requestBody: any;

    // Simplified request format based on the curl example
    if (this.supportsReasoningEffortForModel(model) && reasoningEffort) {
      // For thinking models, we'll add a system prompt to encourage detailed reasoning
      const reasoningDepth = reasoningEffort === 'high' ? 'extremely detailed' :
                           reasoningEffort === 'medium' ? 'detailed' : 'brief';

      // Create a chat-like structure with system prompt
      const contents: any[] = [];

      // Add system prompt if provided
      if (systemPrompt) {
        contents.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
      }

      // Add a special prompt to encourage reasoning
      contents.push({
        role: 'user',
        parts: [{
          text: `Please provide ${reasoningDepth} step-by-step reasoning before giving your final answer. Start with "Reasoning:" and end with "Answer:" to clearly separate your thought process from your final response.`
        }]
      });

      // Add the user prompt
      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      requestBody = {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topK: 40,
          topP: 0.95
        }
      };
    } else {
      // For regular models, use a simpler format based on the curl example
      requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topK: 40,
          topP: 0.95
        }
      };

      // Add system prompt if provided
      if (systemPrompt) {
        requestBody.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }
    }

    // Use the correct API endpoint
    // Make sure we're using the correct endpoint format
    const apiEndpoint = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
    console.log(`Sending request to Google API: ${apiEndpoint}`);

    const requestBodyJson = JSON.stringify(requestBody);
    console.log('Request body:', requestBodyJson);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBodyJson
    });

    // Log the response status and headers
    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()])));

    if (!response.ok) {
      try {
        const errorText = await response.text();
        console.error('Google API error response:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          throw new Error(
            this.isGoogleAIError(errorData)
              ? errorData.error.message
              : `Google AI request failed: ${errorText}`
          );
        } catch (jsonError) {
          throw new Error(`Google API request failed with status ${response.status}: ${errorText}`);
        }
      } catch (error) {
        throw new Error(`Google API request failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    try {
      const responseText = await response.text();
      console.log('Google API response:', responseText);

      // Also log to a file for debugging
      try {
        fs.writeFileSync('google-api-response.json', responseText);
        console.log('Response saved to google-api-response.json');
      } catch (error) {
        console.error('Error saving response to file:', error);
      }

      const data = JSON.parse(responseText) as GoogleAIChatResponse;

      // Check if we have a response with metadata but no content (common with thinking models)
      if (data.usageMetadata && !data.candidates?.[0]?.content?.parts?.[0]?.text) {
        // This is likely a thinking model that doesn't return content via API
        if (reasoningEffort) {
          return `The model ${modelName} supports thinking capabilities in Google AI Studio, ` +
                 `but the thinking process is not provided in the API output. ` +
                 `The API call was successful, but no content was returned. ` +
                 `Consider using the @google/genai library directly for better results.`;
        } else {
          throw new Error('No response content received from Google AI');
        }
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No response received from Google AI');
      }

      return text;
    } catch (error) {
      throw new Error(`Failed to parse Google AI response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async getResponse(params: GetSecondOpinionInput): Promise<LLMResponse | LLMError> {
    try {
      const systemPrompt = params.systemPrompt || undefined;

      const responseText = await this.generateGeminiResponse(
        params.model,
        params.prompt,
        systemPrompt,
        params.temperature,
        params.maxTokens,
        params.reasoning_effort as string
      );

      return createSuccessResponse(responseText);
    } catch (error) {
      return handleProviderError(error, 'Google AI');
    }
  }
}
