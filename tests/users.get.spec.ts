import { test, expect } from "./fixtures";
import { UserFactory } from "../src/api/UserFactory";

test.describe("GET /users", () => {
  test("returns 200 with a JSON array", async ({ userApi }) => {
    const response = await userApi.listUsers();
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("newly created user appears in the list", async ({ userApi }) => {
    const payload = UserFactory.build();
    await userApi.createUser(payload);

    const response = await userApi.listUsers();
    const body = await response.json();

    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: payload.email }),
      ]),
    );
  });
});

test.describe("GET /users/{email}", () => {
  test("returns 200 for an existing user, with the correct data", async ({
    userApi,
  }) => {
    const payload = UserFactory.build();
    await userApi.createUser(payload);

    const response = await userApi.getUser(payload.email);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ...payload });
  });

  test("returns 404 for a non-existent user", async ({ userApi }) => {
    const response = await userApi.getUser("does-not-exist@example.com");

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test.describe("invalid email format in path", () => {
    const invalidEmails = [
      "not-an-email",
      "missing-domain@",
      "@missing-local.com",
    ];

    for (const email of invalidEmails) {
      test(`GET with "${email}" returns 400 or 404`, async ({ userApi }) => {
        const response = await userApi.getUser(email);

        expect([400, 404]).toContain(response.status());
      });
    }
  });
});
