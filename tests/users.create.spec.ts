// tests/users.create.spec.ts
import { test, expect } from "./fixtures";
import { UserFactory } from "../src/api/UserFactory";
import { CreateUserRequest } from "../src/types/User";

test.describe("POST /users", () => {
  test("creates a user with valid data and returns 201", async ({
    userApi,
  }) => {
    const payload = UserFactory.build();
    const response = await userApi.createUser(payload);
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ ...payload });
  });

  const requiredFields: (keyof CreateUserRequest)[] = ["name", "email", "age"];
  for (const field of requiredFields) {
    test(`rejects creation when "${field}" is missing (400)`, async ({
      userApi,
    }) => {
      const payload = UserFactory.build();
      delete payload[field];
      const response = await userApi.createUser(payload);
      expect(response.status()).toBe(400);
    });
  }

  test.describe("age boundary validation", () => {
    const cases = [
      { age: 0, expectedStatus: 400, label: "below minimum" },
      { age: 1, expectedStatus: 201, label: "exact minimum" },
      { age: 150, expectedStatus: 201, label: "exact maximum" },
      { age: 151, expectedStatus: 400, label: "above maximum" },
      { age: -5, expectedStatus: 400, label: "negative value" },
    ];
    for (const { age, expectedStatus, label } of cases) {
      test(`age ${age} (${label}) returns ${expectedStatus}`, async ({
        userApi,
      }) => {
        const payload = UserFactory.build({ age });
        const response = await userApi.createUser(payload);
        expect(response.status()).toBe(expectedStatus);
      });
    }
  });

  test("rejects duplicate email with 409", async ({ userApi }) => {
    const payload = UserFactory.build();
    await userApi.createUser(payload);
    const response = await userApi.createUser(payload);
    expect(response.status()).toBe(409);
  });

  test.describe("invalid email format", () => {
    const invalidEmails = [
      "not-an-email",
      "missing-domain@",
      "@missing-local.com",
      "spaces in@email.com",
      "double@@at.com",
    ];
    for (const email of invalidEmails) {
      test(`rejects "${email}" as invalid format (400)`, async ({
        userApi,
      }) => {
        const payload = UserFactory.build({ email });
        const response = await userApi.createUser(payload);
        expect(response.status()).toBe(400);
      });
    }
  });
});
