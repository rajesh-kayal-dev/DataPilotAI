# DataPilotAI — Test Suite

## Structure

```
tests/
├── unit/               # Fast, isolated, no external I/O
│   ├── intentDetector.test.ts
│   ├── confidenceScore.test.ts
│   ├── alignmentCheck.test.ts
│   ├── cache.test.ts
│   ├── rateLimiter.test.ts
│   └── llmProvider.test.ts
│
└── integration/        # Full request/response cycles (mocked or real DBs)
    ├── health.test.ts
    ├── auth.test.ts
    ├── chat.test.ts
    └── documents.test.ts
```

## Commands

```bash
# Run all tests once (CI)
npm test

# Watch mode (development)
npm run test:watch

# Coverage report (output → ./coverage/)
npm run test:coverage

# Type-check without running tests
npm run type-check
```

## Coverage Targets

| Metric     | Threshold |
|------------|-----------|
| Lines      | 70%       |
| Functions  | 70%       |
| Branches   | 60%       |
| Statements | 70%       |

## Test Conventions

- **Unit tests** mock all I/O (Redis, MongoDB, Qdrant, LLM calls).
- **Integration tests** use `supertest` against the Express app with a test MongoDB instance.
- Test files follow the `*.test.ts` naming convention.
- Each test file has a single `describe` block matching the module under test.
- Use `beforeEach` / `afterEach` for setup/teardown — never rely on test order.

## Adding New Tests

```typescript
// tests/unit/myModule.test.ts
import { describe, it, expect, vi } from 'vitest';
import { myFunction } from '../../src/utils/myModule.js';

describe('myFunction', () => {
  it('should return expected value', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

Tests are populated in **Phase 6** of the refactoring plan.
