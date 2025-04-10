# Changelog

All notable changes to the Mindbridge MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-04-09

### Changed 🔄
- Removed resource tool imports and references from all files
- Updated project name to "Mindbridge"
- Improved provider interface and implementation
- Enhanced documentation structure with dedicated API docs

### Added ✨
- New provider configuration validation system
- Extended error handling for provider-specific cases
- Improved type definitions for provider responses

## [1.0.0] - 2025-04-09

### Added ✨
- Initial release of Mindbridge MCP Server
- Support for multiple LLM providers:
  - OpenAI with GPT-4 and GPT-3.5
  - Anthropic with Claude 3 models
  - DeepSeek chat models
  - Google AI with Gemini models
  - OpenRouter for cross-provider access
  - Local Ollama integration
- Configuration system with environment variables
- Comprehensive error handling and response standardization
- Provider-specific optimizations and features
- TypeScript SDK integration with full type safety
- Development mode with auto-reload
- Production build system
- Documentation:
  - README with setup and usage instructions
  - Contributing guidelines
  - API documentation
  - Environment variable templates

### Security 🔒
- Secure API key handling
- Environment-based configuration
- No key exposure in logs or responses

---
Made with ❤️ by [Pink Pixel](https://pinkpixel.dev)