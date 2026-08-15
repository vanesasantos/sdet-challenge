# Bugs Report — User Management API

This document lists the discrepancies found between `sdet_challenge_api.yml`
(the documented contract) and the actual behavior of the API running at
`http://localhost:3000`, discovered while building the E2E test suite.
Each entry references the automated test(s) that expose it.

## Summary

| ID      | Title                                               | Endpoint                | Severity     |
| ------- | --------------------------------------------------- | ----------------------- | ------------ |
| BUG-001 | Duplicate email returns 500 instead of 409          | `POST /users`           | High         |
| BUG-002 | Invalid email formats are accepted                  | `POST /users`           | High         |
| BUG-003 | Numeric values accepted for string fields           | `POST /users`           | High         |
| BUG-004 | Non-existent user lookup returns 500 instead of 404 | `GET /users/{email}`    | Medium       |
| BUG-005 | Invalid email in path returns 500                   | `GET /users/{email}`    | Medium       |
| BUG-006 | Authentication is not enforced at all               | `DELETE /users/{email}` | **Critical** |

---

## BUG-001: API returns 500 Internal Server Error when attempting to create a user with a duplicate email

**Endpoint**: `POST /users`
**Environments**: dev, prod
**Severity**: High
**Exposing Test**: `users.create.spec.ts >> POST /users >> rejects duplicate email with 409`

### Description

The API crashes with an unhandled server exception when attempting to
register a user using an email address that already exists in the system.
Instead of gracefully handling the database unique constraint violation and
returning a client-side conflict response, the application throws a `500`
status code with a generic internal server error message.

### Expected Behavior (Per Spec)

- **Response Status**: `409 Conflict`
- **Response Body**: Should contain a descriptive error message indicating
  that the email address is already in use (e.g.,
  `{"error": "Email already exists"}`).

### Actual Behavior

- **Response Status**: `500 Internal Server Error`
- **Response Body**: `{"error": "Internal server error"}`

---

## BUG-002: API accepts invalid email formats on user creation

**Endpoint**: `POST /users`
**Environments**: dev, prod
**Severity**: High
**Exposing Test**: `users.create.spec.ts >> POST /users >> invalid email format` (5 parameterized test cases)

### Description

The API lacks server-side validation for email formats during user
creation. When sending payloads containing malformed email addresses
across various invalid formats (missing domain, missing local part,
embedded spaces, double `@`, and fully malformed strings), the application
bypasses validation completely, persists the invalid record, and returns a
success status. Since `email` acts as the primary identifier across `GET`,
`PUT`, and `DELETE` endpoints, invalid email strings are fully persisted
and operational, violating data integrity rules and the `format: email`
constraint declared in the schema.

### Expected Behavior (Per Spec)

- **Response Status**: `400 Bad Request`
- **Response Body**: Should return a validation error message indicating
  that the provided string is not a valid email address, adhering to the
  `format: email` contract declared in `sdet_challenge_api.yml`.

### Actual Behavior

- **Response Status**: `201 Created`
- **Response Body**:
  The API creates the record with `201 Created`
  _(Reproduced across all 5 malformed email variants; the API persists the
  bad data and returns a `201 Created` status in every case.)_

---

## BUG-003: API accepts invalid numeric data types for string fields (name and email) during user creation

**Endpoint**: `POST /users`
**Environments**: dev, prod
**Severity**: High
**Exposing Test**: `users.create.spec.ts >> POST /users >> field type validation` (parameterized cases for `name` and `email` as numbers)

### Description

The API fails to enforce strictly-typed schema validation for string
parameters during user creation. When payload values for `name` or `email`
are sent as numeric values instead of strings, the server does not reject
the payload. Instead, it accepts the invalid data types, processes them as
valid inputs, and successfully creates the user record with a `201
Created` response.

### Expected Behavior (Per Spec)

- **Response Status**: `400 Bad Request`
- **Response Body**: Should return a validation error message indicating a
  type mismatch (e.g., `{"error": "'name' must be a string"}` or
  `{"error": "'email' must be a string"}`).

### Actual Behavior

- **Response Status**: `201 Created`
- **Response Body**: The API creates the record with `201 Created` for both
  numeric `name` and numeric `email` inputs instead of rejecting the
  invalid data types.

---

## BUG-004: API returns 500 Internal Server Error when querying a non-existent user instead of 404 Not Found

**Endpoint**: `GET /users/{email}`
**Environment**: dev, prod
**Severity**: Medium
**Exposing Test**: `users.get.spec.ts >> GET /users/{email} >> returns 404 for a non-existent user`

### Description

When querying a non-existent user email address via the
`GET /dev/users/{email}` endpoint, the API encounters an unhandled server
exception and crashes with a `500` status code. Instead of handling missing
database records gracefully, the application fails to return the standard
client-side error code indicating the resource was not found.

This same failure mode was also observed when confirming that a deleted
user is actually gone — chaining a `GET` right after a successful `DELETE`
(see `users.delete.spec.ts`) surfaces this exact same 500, indicating it is
a general flaw in how the endpoint handles any missing record, not just
records that never existed.

### Expected Behavior (Per Spec)

- **Response Status**: `404 Not Found`
- **Response Body**: Should contain an error message indicating that the
  requested user does not exist (e.g., `{"error": "User not found"}`).

### Actual Behavior

- **Response Status**: `500 Internal Server Error`
- **Response Body**: The server responds with an internal error instead of a `404` status.

---

## BUG-005: API returns 500 Internal Server Error when querying path parameters with invalid email formats

**Endpoint**: `GET /users/{email}`
**Environment**: dev, prod
**Severity**: Medium
**Exposing Test**: `users.get.spec.ts >> GET /users/{email} >> invalid email format in path` (parameterized test block)

### Description

When sending requests to `GET /users/{email}` with malformed or
invalid email strings in the path parameter (e.g., missing domain or
malformed format), the server encounters an unhandled exception and
crashes with a `500` status code. Instead of validating path parameters
and returning a client-side validation error (`400`) or a resource-not-found
status (`404`), the API fails unhandled.

### Expected Behavior (Per Spec)

- **Response Status**: `400 Bad Request` (or `404 Not Found`)
- **Response Body**: Should return a validation message indicating that
  the provided path parameter is not a valid email address (e.g.,
  `{"error": "Invalid email parameter format"}`).

### Actual Behavior

- **Response Status**: `500 Internal Server Error`
- **Response Body**: The API crashes with a server error across all
  invalid path variants tested.

---

## BUG-006: DELETE endpoint does not validate authentication — any or no credentials succeed

**Endpoint**: `DELETE /users/{email}`
**Environment**: dev
**Severity**: Critical
**Exposing Test**: `users.delete.spec.ts >> DELETE /users/{email} >>`

- `returns 401 when no Authentication header is sent`
- `returns 401 with an invalid token`
- `returns 401 (not 404) when deleting a non-existent user without a token`

### Description

The API fails to enforce authentication controls on the destructive
`DELETE /users/{email}` operation. Regardless of whether credentials
are completely omitted, malformed, or passed under arbitrary header keys,
the server processes the deletion request and permanently removes the
specified user record. This represents a severe authorization bypass
vulnerability where any unauthenticated client can delete user records
without restriction.

### Expected Behavior (Per Spec)

- **Response Status**: `401 Unauthorized`
- **Response Body**: Should return an error message indicating missing or
  invalid authentication credentials (e.g.,
  `{"error": "Authentication required or invalid"}`), as mandated by the
  `Authentication` header requirement in `sdet_challenge_api.yml`.

### Actual Behavior

- **Response Status**: `204 No Content`
- **Response Body**: Empty. The resource is permanently deleted from the
  database regardless of missing or invalid credentials.

### Evidence

```text
Case A — Omitted Header:
DELETE /dev/users/user-a@example.com
(No Authentication / Authorization header sent)
Response: 204 No Content (User deleted)

Case B — Invalid Credential:
DELETE /dev/users/user-b@example.com
Authorization: Bearer invalid-xyz-123
Response: 204 No Content (User deleted)

Case C — Arbitrary Header:
DELETE /dev/users/user-c@example.com
FooBar: anything
Response: 204 No Content (User deleted)
```

**Summary**: Confirmed across 3 freshly created user records. The `401
Unauthorized` code path is completely unreachable under any tested input,
matching the same `204` response as a request sent with valid credentials
(`Authorization: Bearer mysecrettoken`) — which is itself undocumented,
since the spec describes the required header as `Authentication`, not the
standard `Authorization: Bearer` scheme actually used by the working case.

### Recommendation

This requires a functional fix, not just a documentation update — the
`DELETE` endpoint must reject requests with missing or incorrect
credentials with `401`, exactly as already documented in the spec. Given
this is a destructive operation with no authentication enforcement, this
should be treated as the highest-priority finding in this report.
