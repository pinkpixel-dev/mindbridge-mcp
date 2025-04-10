import { ProviderFactory, PROVIDER_NAMES, REASONING_MODELS } from './providers/index.js';
import { loadConfig } from './config.js';
import { GetSecondOpinionSchema } from './types.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

class MindBridgeServer extends McpServer {
  private providerFactory: ProviderFactory;

  constructor() {
    super({
      name: 'mindbridge',
      version: '1.2.0'
    }, {
      capabilities: {
        tools: {}
      }
    });

    const config = loadConfig();
    this.providerFactory = new ProviderFactory(config);

    // Register tools
    this.registerTools();
  }

  private registerTools(): void {
    // Register getSecondOpinion tool
    this.tool('getSecondOpinion',
      'Get responses from various LLM providers',
      GetSecondOpinionSchema.shape,
      async (params) => {
        try {
          // Validate provider exists
          const providerName = params.provider.toLowerCase();
          if (!this.providerFactory.hasProvider(providerName)) {
            const availableProviders = this.providerFactory.getAvailableProviders();
            throw new Error(
              `Provider "${params.provider}" not configured. Available providers: ${availableProviders.join(', ')}`
            );
          }

          const provider = this.providerFactory.getProvider(providerName)!;

          // Validate model exists for provider
          if (!provider.isValidModel(params.model)) {
            const availableModels = provider.getAvailableModels();
            throw new Error(
              `Model "${params.model}" not found for provider "${params.provider}". Available models: ${availableModels.join(', ')}`
            );
          }

          // Check reasoning effort compatibility
          if (params.reasoning_effort && !provider.supportsReasoningEffort()) {
            console.warn(
              `Warning: Provider "${params.provider}" does not support reasoning_effort parameter. It will be ignored.`
            );
          }

          // Get response from provider
          const result = await provider.getResponse(params);

          if (result.isError) {
            return {
              content: [{ type: 'text', text: `Error: ${result.content[0].text}` }],
              isError: true
            };
          }

          return {
            content: result.content
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}` }],
            isError: true
          };
        }
      }
    );

    // Register listProviders tool
    this.tool('listProviders',
      'List all configured LLM providers and their available models',
      {},
      async () => {
        try {
          const providers = this.providerFactory.getAvailableProviders();
          const result: Record<string, {
            models: string[];
            supportsReasoning: boolean;
          }> = {};

          for (const provider of providers) {
            result[provider] = {
              models: this.providerFactory.getAvailableModelsForProvider(provider),
              supportsReasoning: this.providerFactory.supportsReasoningEffort(provider)
            };
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}` }],
            isError: true
          };
        }
      }
    );

    // Register listReasoningModels tool
    this.tool('listReasoningModels',
      'List all available models that support reasoning capabilities',
      {},
      async () => {
        try {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                models: REASONING_MODELS,
                description: 'These models are specifically optimized for reasoning tasks and support the reasoning_effort parameter.'
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}` }],
            isError: true
          };
        }
      }
    );
  }
}

export default MindBridgeServer;
