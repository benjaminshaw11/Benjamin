# Contributing to Benjamin

Thank you for your interest in contributing to the Benjamin project! We appreciate your time and effort. This document provides guidelines and instructions for contributing.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

## Getting Started

### Prerequisites
- Git
- Node.js v14+
- Docker & Docker Compose (optional)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/Benjamin.git
   cd Benjamin
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/benjaminshaw11/Benjamin.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

6. **Start development server** (if applicable)
   ```bash
   npm run dev
   ```

---

## Development Workflow

### 1. Sync with Upstream
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `style/` - Code style changes
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Build process, dependencies

### 3. Make Your Changes

- Make logical commits with clear messages
- Keep commits focused and atomic
- Follow coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run tests
npm test

# Run linting
npm run lint

# Run type checking (if applicable)
npm run type-check
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

Go to GitHub and create a PR from your fork to the upstream repository.

---

## Coding Standards

### General Principles
- Write clean, readable code
- Follow DRY (Don't Repeat Yourself) principle
- Keep functions small and focused
- Use meaningful variable names
- Add comments for complex logic

### JavaScript/TypeScript
```javascript
// ✅ Good
const getUserById = (id) => {
  if (!id) throw new Error('ID is required');
  return users.find(user => user.id === id);
};

// ❌ Bad
const getUser = (x) => {
  return users.find(u => u.id === x);
};
```

### Code Organization
```
- imports
- constants
- types/interfaces
- main implementation
- helper functions
- exports
```

### Naming Conventions
- **Variables/Functions**: `camelCase`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Booleans**: Start with `is`, `has`, `can`

### Comments & Documentation
```javascript
/**
 * Fetches user data from API
 * @param {number} userId - The ID of the user
 * @returns {Promise<User>} User object
 * @throws {Error} If user not found
 */
const fetchUser = async (userId) => {
  // ...
};
```

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/updates
- `chore`: Build process, dependencies

### Examples
```bash
# Good
git commit -m "feat(auth): add JWT token validation"
git commit -m "fix(api): handle null response in getUserById"
git commit -m "docs(readme): update installation instructions"

# Bad
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "update"
```

---

## Pull Request Process

### Before Submitting
1. Update your branch with latest upstream changes
2. Run all tests locally and ensure they pass
3. Run linting and code formatting tools
4. Update documentation if needed
5. Add entry to CHANGELOG.md

### PR Title Format
```
[TYPE] Brief description of changes

Examples:
[FEATURE] Add user authentication system
[FIX] Resolve memory leak in data processor
[DOCS] Update API documentation
```

### PR Description Template
Use the [pull_request_template.md](./.github/pull_request_template.md):

```markdown
## Description
Brief description of what this PR does

## Related Issues
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe tests you ran and how to reproduce

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process
1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, PR will be merged
4. Your branch will be deleted

---

## Testing Guidelines

### Test Coverage
- Aim for 80%+ code coverage
- Test happy paths and error cases
- Include edge case testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.js

# Watch mode
npm test -- --watch
```

### Test File Structure
```
__tests__/
├── unit/
│   └── auth.test.js
├── integration/
│   └── api.test.js
└── fixtures/
    └── sample-data.js
```

---

## Documentation

### When to Update Docs
- Adding new features
- Changing existing behavior
- Adding new API endpoints
- Updating setup instructions

### Documentation Locations
- **README.md** - Overview and quick start
- **docs/** - Detailed guides and specifications
- **Code comments** - Inline documentation
- **CHANGELOG.md** - Version history

### Doc Template
```markdown
# Feature Name

## Overview
Brief description of the feature

## Usage
Code examples and how to use

## Configuration
Any configuration options

## Troubleshooting
Common issues and solutions
```

---

## Reporting Issues

### Using Issue Templates
- 🐛 [Bug Report](./.github/ISSUE_TEMPLATE/bug_report.md)
- ✨ [Feature Request](./.github/ISSUE_TEMPLATE/feature_request.md)

### Good Issue Reports Include
- Clear, descriptive title
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment information
- Screenshots/logs if applicable

---

## Project Board

Tasks are tracked on [GitHub Projects](https://github.com/benjaminshaw11/Benjamin/projects):
- **Backlog** - Not yet started
- **In Progress** - Currently being worked on
- **In Review** - PR under review
- **Done** - Completed

---

## Questions?

- 📖 Check existing documentation
- 💬 Open a discussion on GitHub
- 📧 Contact maintainers

---

## Recognition

Contributors will be recognized in:
- [CHANGELOG.md](./CHANGELOG.md)
- GitHub Contributors page
- Project documentation

Thank you for contributing! 🚀
