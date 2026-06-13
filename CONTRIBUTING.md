# Contributing to Orison

Thank you for your interest in contributing to Orison! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites
- .NET Framework 4.5 or later (for legacy build)
- .NET 8.0 SDK or later (for modernized build)
- Visual Studio 2022 or JetBrains Rider
- Git

### Building the Project

1. Clone the repository:
```bash
git clone https://github.com/Mellorison/_0rison.git
cd _0rison
```

2. Build using the .NET CLI:
```bash
dotnet build
```

3. Or build using Visual Studio:
- Open `Orison.sln`
- Build the solution (Ctrl+Shift+B)

### Running Tests

```bash
dotnet test
```

## Branch Naming

Use descriptive branch names:
- `feature/add-camera-system`
- `fix/collision-bug`
- `docs/update-readme`
- `refactor/asset-manager`

## Code Style

Orison follows standard C# conventions:
- Use PascalCase for public members
- Use camelCase for private members and parameters
- Use meaningful variable and method names
- Add XML documentation comments to public APIs
- Keep methods focused and concise

Run the formatter before committing:
```bash
dotnet format
```

## Commit Messages

Follow conventional commits:
- `feat: add camera system`
- `fix: resolve collision detection bug`
- `docs: update installation guide`
- `refactor: improve asset loading`
- `test: add unit tests for collision`

Example:
```
feat: add camera system with zoom and pan support

- Add Camera class with position and zoom properties
- Implement camera follow mode
- Add render layer support
- Update samples to use camera
```

## Running Tests

Before submitting a pull request:
1. Run all tests: `dotnet test`
2. Ensure all tests pass
3. Add tests for new features
4. Update documentation if needed

## Submitting Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Ensure all tests pass
7. Submit a pull request with a clear description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests pass
```

## Reporting Bugs

When reporting bugs, please include:
- .NET version
- Operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error messages or stack traces

## Requesting Features

Before requesting a feature:
1. Check existing issues
2. Check if the feature aligns with project goals
3. Provide a clear description of the feature
4. Explain the use case
5. Consider if you can contribute the implementation

## Code of Conduct

Be respectful and constructive:
- Welcome newcomers
- Provide helpful feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Questions?

- Open an issue on GitHub
- Join the Discord: https://discord.gg/S3F5HcP
- Email: mellorison@gmail.com
