# Contributing to Budget Buddy

Thank you for your interest in contributing to Budget Buddy! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in the Issues section.
2. If not, create a new issue with a clear title and description.
3. Include steps to reproduce the bug and, if possible, screenshots.
4. Describe what you expected to happen and what actually happened.
5. Include information about your environment (browser, operating system, etc.).

### Suggesting Features

1. Check if the feature has already been suggested in the Issues section.
2. If not, create a new issue with a clear title and description.
3. Explain why this feature would be useful to most users.
4. Provide examples of how the feature might work.

### Pull Requests

1. Fork the repository.
2. Create a new branch from `main` for your changes.
3. Make your changes, following the code style of the project.
4. Include tests if appropriate.
5. Update documentation if necessary.
6. Submit a pull request to the `main` branch.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/budget-buddy.git
cd budget-buddy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:
```bash
npm run dev
```

## Code Style

- Follow the existing code style.
- Use meaningful variable and function names.
- Comment your code when necessary.
- Use TypeScript for type safety.
- Follow React best practices.

## Testing

- Test your changes thoroughly before submitting a pull request.
- Include unit tests for new functionality if possible.
- Ensure all existing tests pass.

## Documentation

- Update documentation when necessary.
- Document new features and API changes.
- Use clear language and examples.

## Versioning

We use [Semantic Versioning](https://semver.org/). Please follow these guidelines:

- MAJOR version when you make incompatible API changes
- MINOR version when you add functionality in a backward compatible manner
- PATCH version when you make backward compatible bug fixes

## License

By contributing to Budget Buddy, you agree that your contributions will be licensed under the project's license.

Thank you for contributing to Budget Buddy! 