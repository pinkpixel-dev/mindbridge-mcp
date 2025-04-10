# Contributing to Second Opinion MCP ✨

First off, thank you for considering contributing to Second Opinion MCP! It's people like you that make this project a great tool for everyone. This document provides guidelines and steps for contributing.

## Code of Conduct 🤝

By participating in this project, you are expected to uphold our Code of Conduct:

- Be respectful and inclusive
- Exercise consideration and empathy
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show courtesy and respect towards others

## How Can I Contribute? 🌟

### Reporting Bugs 🐛

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps to reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed
* Explain the behavior you expected to see
* Include any relevant error messages or logs

### Suggesting Enhancements ✨

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* A clear and descriptive title
* A detailed description of the proposed functionality
* Any possible drawbacks or considerations
* If possible, examples of similar features in other projects

### Pull Requests 🚀

1. Fork the repository and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style guidelines
5. Update documentation as needed
6. Issue the pull request!

## Development Process 🔧

1. Clone the repository:
   ```bash
   git clone https://github.com/pinkpixel-dev/mindbridge.git
   cd mindbridge
   ```

2. Install dependencies:
   ```bash
   ./install.sh
   ```

3. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

## Style Guidelines 📝

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### TypeScript Style Guide

* Use TypeScript's strict mode
* Always define proper types and interfaces
* Use async/await over raw promises
* Document complex functions with JSDoc comments
* Follow the existing code formatting (Prettier + ESLint)

## Adding New Providers 🔌

When adding support for a new LLM provider:

1. Create a new file in `src/providers/`
2. Implement the `LLMProvider` interface
3. Add proper error handling and type definitions
4. Update the provider factory
5. Add configuration options to the README
6. Include example usage
7. Add tests if applicable

## Documentation 📚

* Keep documentation up to date with changes
* Use clear and concise language
* Include code examples where helpful
* Document both success and error scenarios
* Add TypeScript type definitions

## Testing 🧪

* Write tests for new features
* Ensure existing tests pass
* Test edge cases and error conditions
* Follow existing test patterns

## Questions? 💭

Feel free to open an issue for discussion or reach out to [@sizzlebop](https://github.com/sizzlebop) on Discord.

---
Made with ❤️ by [Pink Pixel](https://pinkpixel.dev)