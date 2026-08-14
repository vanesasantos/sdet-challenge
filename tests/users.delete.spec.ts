import { test, expect } from "./fixtures";
import { UserFactory } from "../src/api/UserFactory";

const VALID_TOKEN = "mysecrettoken";

test.describe("DELETE /users/{email}", () => {
  test("deletes an existing user with a valid token, and the user is actually gone", async ({
    userApi,
  }) => {
    const payload = UserFactory.build();
    await userApi.createUser(payload);

    const deleteResponse = await userApi.deleteUser(payload.email, VALID_TOKEN);
    expect(deleteResponse.status()).toBe(204);

    const getResponse = await userApi.getUser(payload.email);

    // BUG-004: Expected 404 (user not found), actual API returns 500.
    // The assertion is intentionally left as 404 (behavior expected per spec)
    // — this test documents the regression: once BUG-004 is fixed,
    // this test will turn green on its own, without requiring anyone to update it.
    expect(getResponse.status()).toBe(404);
  });

  test("returns 401 when no Authentication header is sent", async ({
    userApi,
  }) => {
    const payload = UserFactory.build();
    await userApi.createUser(payload);

    const response = await userApi.deleteUser(payload.email);

    expect(response.status()).toBe(401);
  });

  test("user remains after a 401 delete attempt", async ({ userApi }) => {
    const payload = UserFactory.build();
    await userApi.createUser(payload);

    await userApi.deleteUser(payload.email);

    const getResponse = await userApi.getUser(payload.email);

    // BUG-006: DELETE endpoint does not validate authentication — any or no credentials succeed
    // The assertion is intentionally left as 200 (behavior expected per spec)
    // — this test documents the regression: once BUG-006 is fixed and authentication is enforced,
    // this test will turn green on its own, without requiring anyone to update it.
    expect(getResponse.status()).toBe(200);
  });

  test("returns 401 with an invalid token", async ({ userApi }) => {
    const payload = UserFactory.build();
    await userApi.createUser(payload);

    const response = await userApi.deleteUser(
      payload.email,
      "wrong-token-12345",
    );

    expect(response.status()).toBe(401);
  });

  test("returns 404 when deleting a non-existent user", async ({ userApi }) => {
    const nonExistentEmail = UserFactory.build().email;

    const response = await userApi.deleteUser(nonExistentEmail, VALID_TOKEN);

    expect(response.status()).toBe(404);
  });

  test("returns 401 (not 404) when deleting a non-existent user without a token", async ({
    userApi,
  }) => {
    const nonExistentEmail = UserFactory.build().email;

    const response = await userApi.deleteUser(nonExistentEmail);

    expect(response.status()).toBe(401);
  });
});
