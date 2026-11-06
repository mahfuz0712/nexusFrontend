# Nexus-Frontend

The frontend companion library for [nexus-backend](https://www.npmjs.com/package/@mahfuz0712/nexus-backend). Returns a real axios instance with a typed `successResponse` / `errorResponse` contract baked in — no wrapper methods, no unwrapping, just axios with the right types and a typed error.

> Designed specifically to pair with `nexus-backend`. It assumes every endpoint responds using `successResponse()` on success and `errorResponse()` (via `NexusError` and `errorMiddleware`) on failure.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [createNexusClient](#createnexusclient)
  - [NexusError](#nexuserror)
  - [Error Helpers](#error-helpers)
- [Response Shape](#response-shape)
- [Auth Tokens & Interceptors](#auth-tokens--interceptors)
- [TypeScript](#typescript)
- [License](#license)

---

## Installation

```bash
npm install axios nexus-frontend
```

---

## Quick Start

```ts
// apis/api.ts
import { createNexusClient } from "nexus-frontend";

export const api = createNexusClient({
  baseURL: "https://api.yourapp.com",
});
```

`api` is a real axios instance — use it exactly like `axios.create()`. Nothing about the response is unwrapped; you get exactly what `nexus-backend`'s `successResponse()` sent, fully typed.

```ts
import { api } from "./apis/api";
import { isNexusError } from "nexus-frontend";

interface User {
  id: number;
  name: string;
  email: string;
}

async function getUser(id: number) {
  try {
    const response = await api.get<User>(`/users/${id}`);

    console.log(response.data.data);    // User — the "data" field from successResponse()
    console.log(response.data.message); // "User fetched successfully"
    console.log(response.status);       // 200 — plain HTTP status, normal axios
  } catch (err) {
    if (isNexusError(err)) {
      console.error(err.message);    // message from NexusError / errorResponse()
      console.error(err.statusCode); // HTTP status from the backend response
      console.error(err.errors);     // errors from NexusError, if any
    }
  }
}
```

---

## API Reference

### `createNexusClient(config)`

```ts
createNexusClient(config: NexusClientConfig): NexusInstance
```

Creates a real axios instance (`axios.create(config)`). `NexusInstance` is `AxiosInstance` with `get`/`post`/`put`/`patch`/`delete` retyped so the resolved value is `AxiosResponse<SuccessResponse<T>>` — matching what `nexus-backend`'s `successResponse()` sends. **No methods are added or changed at runtime** — `defaults`, `interceptors`, `getUri`, everything axios exposes works exactly as-is.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `config.baseURL` | `string` | Yes | Base URL for all requests |
| `config.*` | `AxiosRequestConfig` | No | Any other valid axios config option (`withCredentials`, `timeout`, `headers`, etc.) |

```ts
export const api = createNexusClient({
  baseURL: "https://api.yourapp.com",
  withCredentials: true,
  timeout: 10000,
  headers: { "X-App-Version": "1.0.0" },
});
```

**Built-in interceptor behaviour:**

- **On success** — nothing is touched. `response.data` is exactly the body `nexus-backend` sent via `successResponse()`: `{ success: true, data, message }`.
- **On error** — if the server responded with an `errorResponse()` body (i.e. from a thrown `NexusError` handled by `errorMiddleware`), a `NexusError` is thrown with the same `message`, HTTP `statusCode`, and `errors`.
- **On network failure** — timeouts, CORS errors, or no connection also throw a `NexusError` with `statusCode: 0`.

---

### `NexusError`

The only error type ever thrown by requests made through `createNexusClient`. Mirrors `nexus-backend`'s `NexusError` shape so error handling feels identical on both ends.

```ts
class NexusError extends Error {
  statusCode: number; // HTTP status code, or 0 for network errors
  errors?: any;        // Field-level or additional error details from the server
}
```

```ts
import { isNexusError } from "nexus-frontend";

try {
  await api.post("/users", { name: "", email: "not-an-email" });
} catch (err) {
  if (isNexusError(err)) {
    if (err.statusCode === 422) console.log(err.errors);
    if (err.statusCode === 401) {/* redirect to login */}
    if (err.statusCode === 0) {/* network/server unreachable */}
  }
}
```

---

### Error Helpers

All helpers check against `NexusError` (the only error type these requests ever throw) — not raw `AxiosError`.

| Function | Signature | Description |
|---|---|---|
| `isNexusError` | `(error: unknown) => error is NexusError` | Type guard — narrows `catch` value to `NexusError` |
| `isNexusStatus` | `(error: unknown, statusCode: number) => boolean` | True if error is a `NexusError` with matching `statusCode` |
| `notNexusError` | `(error: unknown) => boolean` | True if error is **not** a `NexusError` |
| `notNexusStatus` | `(error: unknown, statusCode: number) => boolean` | True if not a `NexusError`, or `statusCode` doesn't match |
| `nexusError` | `(error: unknown) => string \| undefined` | Extracts the message from a `NexusError`, if any |
| `showError` | `(error: unknown, customMsg?: string) => void` | Shows an `alert()` with the error message or a fallback |

```ts
import { isNexusStatus } from "nexus-frontend";

try {
  await api.delete(`/posts/${id}`);
} catch (err) {
  if (isNexusStatus(err, 403)) {
    alert("You don't have permission to delete this post.");
  }
}
```

---

## Response Shape

These match `nexus-backend`'s `response.types.ts` exactly — `nexus-frontend` re-exports them so you don't need a separate install.

#### Success — from `successResponse(data, message)`

```ts
interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data: T;
}
```

```ts
const response = await api.get<Product>("/products/42");

response.data.success  // true
response.data.data     // Product
response.data.message  // "Product fetched successfully"
response.status        // 200 — HTTP status from axios, not from the body
```

#### Error — from `errorResponse(message, errors, stack)` / thrown `NexusError`

```ts
interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
  stack?: string;
}
```

On the frontend, this body is never seen directly — it is caught by the interceptor and re-thrown as a frontend `NexusError`. The backend must send a non-2xx HTTP status (as `errorMiddleware` does); a `200` response containing `{ success: false }` is still treated as a successful Axios response.

---

## Auth Tokens & Interceptors

`api` is a real axios instance, so everything works the standard axios way.

```ts
// set token after login
api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

// clear on logout
delete api.defaults.headers.common["Authorization"];

// add your own interceptors freely
api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);
```

> **Note:** unlike many axios wrappers, the built-in interceptor here does **not** unwrap the body on success — `response.data` is always the raw `successResponse()` shape. This keeps client-side types in perfect sync with whatever `nexus-backend` actually sent, with no hidden transformation in between.

---

## TypeScript

nexus-frontend is written in TypeScript and ships type declarations. No `@types` package needed.

```ts
import type { SuccessResponse, ErrorResponse } from "nexus-frontend";

interface Post {
  id: number;
  title: string;
  body: string;
}

const response = await api.get<Post>("/posts/1");
// response.data is typed as SuccessResponse<Post>
// response.data.data is typed as Post
```

```ts
import { createNexusClient } from "nexus-frontend";
import type { NexusClientConfig } from "nexus-frontend";

function buildClient(config: NexusClientConfig) {
  return createNexusClient(config);
}
```

---

## License

MIT