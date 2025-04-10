import { GetSecondOpinionInput, LLMResponse, LLMError } from '../types.js';

export interface LLMProvider {
  /**
   * Get a response from the LLM provider
   * @param params The input parameters for the request
   * @returns A promise that resolves to either a successful response or an error
   */
  getResponse(params: GetSecondOpinionInput): Promise<LLMResponse | LLMError>;

  /**
   * Check if this provider supports reasoning effort parameter
   * @returns boolean indicating if reasoning_effort is supported
   */
  supportsReasoningEffort(): boolean;

  /**
   * Check if a specific model supports reasoning effort parameter
   * @param model The model name to check
   * @returns boolean indicating if reasoning_effort is supported for this model
   */
  supportsReasoningEffortForModel(model: string): boolean;

  /**
   * Get the available models for this provider
   * @returns Array of model identifiers
   */
  getAvailableModels(): string[];

  /**
   * Validate if a given model name is valid for this provider
   * @param model The model name to validate
   * @returns boolean indicating if the model is valid
   */
  isValidModel(model: string): boolean;
}

/**
 * Base error handler for LLM providers
 * @param error The error object
 * @param provider The name of the provider where the error occurred
 * @returns A standardized LLMError object
 */
export function handleProviderError(error: unknown, provider: string): LLMError {
  let errorMessage = 'An unknown error occurred';

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  return {
    isError: true,
    content: [{
      type: 'text',
      text: `Error from ${provider}: ${errorMessage}`
    }]
  };
}

/**
 * Create a successful response object
 * @param text The text response from the LLM
 * @returns A standardized LLMResponse object
 */
export function createSuccessResponse(text: string): LLMResponse {
  return {
    isError: false,
    content: [{ type: 'text', text }]
  };
}