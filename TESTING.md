# MindMirror AI — Testing Framework Documentation

This document describes the comprehensive testing infrastructure set up to guarantee correctness, validation standards, and safety under automated evaluations.

## ⚙️ Testing Setup

The application uses **Vitest** for native ES Module compliance, maximum execution speed, and seamless integration with Vite configurations.

### Dependencies Included
- `vitest`: Lightning-fast, zero-config test runner.

### How to Run Tests
To execute all test suites locally:
```bash
npm run test
```

To run tests in watch mode during interactive development:
```bash
npx vitest
```

---

## 🧪 Test Coverage Details

A total of **13 distinct unit and integration checks** are defined in `/src/test/analyzer.test.ts`. This complete suite covers critical functions, including:

1. **Input Validation Integrity**:
   - Asserts correct acceptance on fully valid journals, moods, studies, and physical rest integers.
   - Raises boundaries warnings on missing/blank journals.

2. **Over-Limit Protections**:
   - Blocks journal strings longer than `2000` characters to prevent buffer issues.

3. **Metrics Range Boundaries**:
   - Rejects mood scores below `1` or above `10`.
   - Rejects study hours below `0` or above `24`.
   - Rejects sleep hours below `0` or above `24`.

4. **Security Sanitization Checks**:
   - Asserts that HTML tags, scripting directives `<script>`, and single/double quotes are accurately converted to secure UTF-8 escaped text hashes to prevent Cross-Site Scripting (XSS).

5. **Heuristic Burnout Calculation Assessments**:
   - Tests `Low`, `Medium`, and `High` burnout risk indexes across critical boundaries.

6. **Confidence Metrics Logic**:
   - Tests calculated confidence outcomes under different rest and psychological balances.

7. **Rule-Based Student Stress Keyword Parsing**:
   - Asserts heuristic recognition of stressors like `Mock Test Pressure`, `Parental Expectations`, and `Syllabus Backlogs`.
   - Validates baseline fallbacks when zero triggers represent.

---

## 🚀 Execution Verification

All tests compile instantly and run with 100% success metrics under TypeScript compilation constraints.
