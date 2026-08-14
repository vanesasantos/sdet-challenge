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

  test.describe("required field sent as null", () => {
    const requiredFields: (keyof CreateUserRequest)[] = [
      "name",
      "email",
      "age",
    ];

    for (const field of requiredFields) {
      test(`rejects creation when "${field}" is null (400)`, async ({
        userApi,
      }) => {
        const payload = {
          ...UserFactory.build(),
          [field]: null,
        } as unknown as Partial<CreateUserRequest>;

        const response = await userApi.createUser(payload);

        expect(response.status()).toBe(400);
      });
    }
  });

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
    const invalidEmailTemplates: {
      label: string;
      build: (unique: string) => string;
    }[] = [
      { label: "missing @ entirely", build: (u) => `not-an-email-${u}` },
      { label: "missing domain", build: (u) => `missing-domain-${u}@` },
      { label: "missing local part", build: (u) => `@missing-local-${u}.com` },
      { label: "embedded spaces", build: (u) => `spaces in-${u}@email.com` },
      { label: "double @", build: (u) => `double-${u}@@at.com` },
    ];

    for (const { label, build } of invalidEmailTemplates) {
      test(`rejects invalid email format: ${label}`, async ({ userApi }) => {
        const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const email = build(unique);
        const payload = UserFactory.build({ email });

        const response = await userApi.createUser(payload);
        expect(response.status()).toBe(400);
      });
    }
  });

  test.describe.only("field type validation", () => {
    const typeMismatchCases: {
      label: string;
      overrides: (unique: string) => Record<string, unknown>;
    }[] = [
      {
        label: "name sent as a number",
        overrides: (u) => ({ name: Number(u) }),
      },
      {
        label: "email sent as a number",
        overrides: (u) => ({ email: Number(u) }),
      },
      { label: "age sent as a string", overrides: () => ({ age: "150" }) },
      { label: "age sent as a boolean", overrides: () => ({ age: true }) },
      { label: "name sent as a boolean", overrides: () => ({ name: false }) },
    ];

    for (const { label, overrides } of typeMismatchCases) {
      test(`rejects creation when ${label} (400)`, async ({ userApi }) => {
        const unique = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
        const basePayload = UserFactory.build({
          email: `qa.${unique}@example.com`,
        });

        const payload = {
          ...basePayload,
          ...overrides(unique),
        } as unknown as Partial<CreateUserRequest>;

        const response = await userApi.createUser(payload);

        expect(response.status()).toBe(400);
      });
    }
  });
});
