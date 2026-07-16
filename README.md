## Developer quickstart

If you want to work on the codebase locally, follow these quick steps to set up developer tooling (linters, formatters, and pre-commit hooks).

1) Install root dev tools (run from repository root)

```bash
# install dev tools (one-time)
npm install --save-dev eslint prettier husky lint-staged eslint-config-airbnb-base eslint-plugin-import eslint-config-prettier eslint-plugin-prettier

# install husky hooks
npm run prepare
```

2) Install dependencies for backend and frontend

```bash
cd backend
npm install

cd ../frontend
npm install
```

3) Lint and format

```bash
# from repo root
npm run lint
npm run format
```

Notes
- This repository uses ESLint (Airbnb style) + Prettier. Hooks are configured with Husky + lint-staged to run linting/formatting before commits.
- If you prefer a different style guide, update `.eslintrc.js` accordingly.
