# MindMirror AI — Security Architecture Plan

MindMirror AI implements a professional, full-stack defensive strategy to protect students and keep environments secure. This document summarizes all active security measures.

---

## 🛡️ Major Security Implementations

### 1. Server-Side Mirror Validation
All parameters passed to `/api/analyze` are parsed and validated on the backend. This guarantees that bypasses on client-side controls are rejected:
- **Type Guards**: Enforces string-only formats for journal essays and numbers for scores.
- **Range Boundaries**: Restricts sleep, mood, and study indices to logical limits (e.g. sleep/study hours cannot exist outside the `0 - 24` range; mood must reside within `1 - 10`).

### 2. High-Grade XSS Escaping Sanitization
All freeform user inputs are passed through our utility-level sanitizer `sanitizeInput` before being stored or supplied to the AI engine:
- Converts `<` and `>` into HTML entities (`&lt;` and `&gt;`).
- Converts `&` into `&amp;`.
- Escapes single quotes (`&#039;`) and double quotes (`&quot;`) to disarm payloads.

### 3. Payload Mitigation and Character Limits
- The journal text is strictly limited to **2000 characters**.
- The exam type is sliced to a maximum of **50 draft characters**.
- High payload overflow attempts are rejected by the API, protecting against buffer/memory-based exhaustion.

### 4. Generics and Safe API Error Envelopes
- System error logging prevents database names, engine configurations, or raw service keys (`GEMINI_API_KEY`) from escaping into the client browser.
- All server errors return generic, user-safe text prompts.

### 5. Safe Response Parsing
- The AI's JSON output is validated and parsed in `try-catch` blocks.
- If the model returns malformed JSON, the platform falls back to structured defaults instead of breaking script execution.
