# GitHub Workflows Setup Guide

This guide explains the workflows that should be configured for the Benjamin project.

## 📋 Workflows to Create

### 1. **tests.yml** - Automated Testing
**Location**: `.github/workflows/tests.yml`

Runs tests on every push and pull request:
- Tests against Node.js versions: 14.x, 16.x, 18.x
- Generates code coverage reports
- Uploads to Codecov
- Runs security audit
- Generates SBOM (Software Bill of Materials)

**Triggers**: Push to main/develop, Pull requests to main/develop

### 2. **lint.yml** - Code Quality & Linting
**Location**: `.github/workflows/lint.yml`

Checks code quality on every commit:
- ESLint for JavaScript linting
- Prettier for code formatting
- Type checking
- Security audit
- SonarQube integration (if configured)

**Triggers**: Push to main/develop, Pull requests to main/develop

### 3. **release.yml** - Automated Releases
**Location**: `.github/workflows/release.yml`

Automates release process when tags are pushed:
- Runs tests
- Builds project
- Creates GitHub release
- Publishes to npm (optional)
- Sends Slack notifications (if configured)

**Triggers**: Tag push (v*)

### 4. **auto-assign.yml** - Auto-assignment & Labeling
**Location**: `.github/workflows/auto-assign.yml`

Automatically manages issues and PRs:
- Auto-assigns issues to creator
- Auto-assigns PRs to creator
- Adds "triage" label to new issues

**Triggers**: Issue opened/reopened, PR opened/reopened

---

## 🚀 How to Set Up Workflows

### Step 1: Create Workflow Files
1. Go to `.github/workflows/` directory
2. Create each `.yml` file listed above with provided content
3. Commit and push to repository

### Step 2: Configure Secrets (if needed)
Go to **Settings > Secrets and variables > Actions** and add:

- `NPM_TOKEN` - For npm publishing
- `SLACK_WEBHOOK` - For Slack notifications
- `SONAR_TOKEN` - For SonarQube integration

### Step 3: Set Branch Protection Rules
Go to **Settings > Branches > Branch protection rules**:

For `main` branch:
- ✅ Require status checks to pass before merging
- ✅ Require code reviews before merging
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require branches to be up to date before merging

### Step 4: Configure Issue Labels
Go to **Issues > Labels** and create:
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `triage` - Needs triage

### Step 5: Create Milestones
Go to **Issues > Milestones** and create:
- Project Setup (Due: 2026-07-22)
- Code Quality (Due: 2026-07-30)
- Documentation (Due: 2026-08-10)

---

## 📝 Environment Variables

### For npm scripts, ensure your `package.json` has:

```json
{
  "scripts": {
    "test": "jest",
    "lint": "eslint .",
    "format:check": "prettier --check .",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "build": "npm run type-check && npm run lint && npm test",
    "sonar": "sonar-scanner",
    "analyze": "npm run type-check"
  }
}
```

---

## 🔒 Secrets Configuration

### Required Secrets (optional but recommended):

1. **NPM_TOKEN**
   - Get from: npmjs.com > Account > Authentication Tokens
   - Use for: Publishing to npm registry

2. **SLACK_WEBHOOK**
   - Get from: Slack > Incoming Webhooks
   - Use for: Release notifications

3. **SONAR_TOKEN**
   - Get from: SonarCloud or SonarQube instance
   - Use for: Code quality analysis

---

## ✅ Workflow Status Checks

After setting up workflows, you'll see status checks on PRs:
- ✅ tests / test (Node.js versions)
- ✅ tests / security-audit
- ✅ lint / lint
- ✅ lint / code-quality

All must pass before merging to main branch.

---

## 📊 Monitoring Workflows

View workflow runs:
1. Go to **Actions** tab in repository
2. Click on a workflow to see details
3. Click on a run to see job logs

---

## 🆘 Troubleshooting

### Workflows not running?
- Check **Actions** tab is enabled
- Verify workflow files are in `.github/workflows/`
- Check for syntax errors in YAML files

### Tests failing?
- Review job logs in Actions tab
- Run `npm test` locally to debug
- Check Node.js version compatibility

### Secrets not found?
- Verify secrets are added to **Settings > Secrets**
- Check secret names match workflow file references
- Ensure proper permissions

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Last Updated**: 2026-07-15
