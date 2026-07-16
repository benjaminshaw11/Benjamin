# Tests for admin UI approve/reject flows

This file contains integration tests that verify the admin approve/reject endpoints:

- approve sets transaction.status = 'confirmed'
- approve is idempotent (calling twice keeps status confirmed)
- reject sets transaction.status = 'rejected'

Run locally (from repo root):

cd backend
# ensure dependencies
npm ci
# run the tests (if you use jest):
npx jest tests/admin-deposits.test.js --runInBand

If your project uses another test runner, adapt the command accordingly.
