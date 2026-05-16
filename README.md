# Nexus-frontend

The frontend companion library for [@mahfuz0712/nexus-backend](https://www.npmjs.com/package/@mahfuz0712/nexus-backend). Wraps axios with interceptors that automatically unwrap structured API responses and throw typed errors — so your `try/catch` blocks always know exactly what they're dealing with.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [createNexusClient](#createnexusclient)
  - [NexusError](#nexuserror)
  - [isNexusError](#isnexuserror)
- [Response Shape](#response-shape)
- [TypeScript](#typescript)
- [License](#license)

---

## Installation

```bash
npm install nexus-frontend axios
```

---

## Quick Start

**Create a client instance** (do this once and export it):

```ts
// lib/api.ts
import { createNexusClient } from "nexus-frontend";

export const api = createNexusClient({
  baseURL: "https://api.yourapp.com",
});
```

**Use it in your components or services:**

```ts
import { api } from "./lib/api";
import { isNexusError, SuccessResponse } from "nexus-frontend";

interface User {
  id: number;
  name: string;
  email: string;
}

async function getUser(id: number) {
  try {
    const response = await api.get<User>(`/users/${id}`);

    console.log(response.data);    // User object
    console.log(response.message); // "User fetched successfully"
  } catch (err) {
    if (isNexusError(err)) {
      console.error(err.message);    // "User not found"
      console.error(err.statusCode); // 404
      console.error(err.errors);     // field-level errors if any
    }
  }
}
```

---

## API Reference

### `createNexusClient(config)`

Creates and returns a configured axios instance with nexus interceptors attached.

```ts
createNexusClient(config: NexusClientConfig): AxiosInstance
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `config.baseURL` | `string` | Yes | Base URL for all requests |
| `config.*` | `AxiosRequestConfig` | No | Any other valid axios config option |

**Example with additional options:**

```ts
import { createNexusClient } from "nexus-frontend";

export const api = createNexusClient({
  baseURL: "https://api.yourapp.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
```

**Setting an auth token after login:**

```ts
api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
```

**Interceptors behaviour:**

- On success — if the response body has `success: true`, the interceptor unwraps it and returns the `SuccessResponse` object directly. You access `.data` and `.message` without an extra `.data` layer.
- On error — if the server responds with a nexusjs `ErrorResponse` body, the interceptor throws a `NexusError` with the structured message, status code, and field errors attached.
- On network failure — timeouts, CORS errors, or no connection also throw a `NexusError` with `statusCode: 0`.

---

### `NexusError`

A typed error class thrown by the client interceptor whenever a request fails. Extends the native `Error`.

```ts
class NexusError extends Error {
  statusCode: number; // HTTP status code, or 0 for network errors
  errors?: any;       // Field-level or additional error details from the server
}
```

**Example — handling field validation errors from the server:**

```ts
import { isNexusError } from "nexus-frontend";

try {
  await api.post("/users", { name: "", email: "not-an-email" });
} catch (err) {
  if (isNexusError(err)) {
    if (err.statusCode === 422) {
      // err.errors contains the field errors sent by ValidationError on the backend
      console.log(err.errors);
      // [
      //   { field: "name", message: "Name is required" },
      //   { field: "email", message: "Must be a valid email address" }
      // ]
    }

    if (err.statusCode === 401) {
      // redirect to login
    }

    if (err.statusCode === 0) {
      // no internet / server unreachable
    }
  }
}
```

---

### `isNexusError(error)`

A type guard that narrows an unknown `catch` value to `NexusError`. Always use this before accessing `.statusCode` or `.errors`.

```ts
isNexusError(error: unknown): error is NexusError
```

**Example:**

```ts
} catch (err) {
  if (isNexusError(err)) {
    // err is NexusError here — fully typed
    console.log(err.statusCode);
  } else {
    // unexpected non-nexus error
    console.error(err);
  }
}
```

---

## Response Shape

The interceptor unwraps responses to match these shapes directly. These types are exported for use in your own code.

#### Success

When the server responds with `2xx` and a nexusjs success body, the resolved value of your `await` call is:

```ts
interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data: T;
}
```

```ts
const response = await api.get<Product>("/products/42");

response.success  // true
response.data     // Product
response.message  // "Product fetched successfully"
```

#### Error

When the server responds with an error, a `NexusError` is thrown with values extracted from:

```ts
interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
}
```

---

## TypeScript

nexus-frontend is written in TypeScript and ships type declarations. No `@types` package needed.

Pass your expected data shape as a generic to any axios method and the response will be fully typed:

```ts
import type { SuccessResponse } from "nexus-frontend";

interface Post {
  id: number;
  title: string;
  body: string;
}

const response = await api.get<Post>("/posts/1");
// response.data is typed as Post
```

You can also import `NexusClientConfig` to type a client factory wrapper:

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