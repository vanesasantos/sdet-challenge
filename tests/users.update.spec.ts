import { test, expect } from "./fixtures";
import { UserFactory } from "../src/api/UserFactory";
import { UpdateUserRequest } from "../src/types/User";

test.describe("PUT /users/{email}", () => {
  test("updates an existing user and returns 200", async ({ userApi }) => {
    const original = UserFactory.build();
    await userApi.createUser(original);

    const updated = { ...original, name: "Updated Name", age: 31 };
    const response = await userApi.updateUser(original.email, updated);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ...updated });
  });

  test("returns 404 when updating a non-existent user", async ({ userApi }) => {
    const nonExistentEmail = UserFactory.build().email;
    const payload = UserFactory.build();

    const response = await userApi.updateUser(nonExistentEmail, payload);

    expect(response.status()).toBe(404);
  });

  test.describe("field validation on update", () => {
    const requiredFields: (keyof UpdateUserRequest)[] = [
      "name",
      "email",
      "age",
    ];

    for (const field of requiredFields) {
      test(`rejects update when "${field}" is missing (400)`, async ({
        userApi,
      }) => {
        const original = UserFactory.build();
        await userApi.createUser(original);

        const payload = { ...original };
        delete payload[field];

        const response = await userApi.updateUser(original.email, payload);

        expect(response.status()).toBe(400);
      });
    }

    test.describe("age boundary validation on update", () => {
      const cases = [
        { age: 0, expectedStatus: 400, label: "below minimum" },
        { age: 1, expectedStatus: 200, label: "exact minimum" },
        { age: 150, expectedStatus: 200, label: "exact maximum" },
        { age: 151, expectedStatus: 400, label: "above maximum" },
      ];

      for (const { age, expectedStatus, label } of cases) {
        test(`age ${age} (${label}) returns ${expectedStatus}`, async ({
          userApi,
        }) => {
          const original = UserFactory.build();
          await userApi.createUser(original);

          const response = await userApi.updateUser(original.email, {
            ...original,
            age,
          });

          expect(response.status()).toBe(expectedStatus);
        });
      }
    });
  });

  test.describe("updating email to a duplicate", () => {
    test("returns 409 when the new email already belongs to another user", async ({
      userApi,
    }) => {
      const userA = UserFactory.build();
      const userB = UserFactory.build();
      await userApi.createUser(userA);
      await userApi.createUser(userB);

      const response = await userApi.updateUser(userA.email, {
        ...userA,
        email: userB.email,
      });

      expect(response.status()).toBe(409);
    });

    test("does not corrupt the existing user's data regardless of the status returned", async ({
      userApi,
    }) => {
      const userA = UserFactory.build();
      const userB = UserFactory.build();
      await userApi.createUser(userA);
      await userApi.createUser(userB);

      await userApi.updateUser(userA.email, { ...userA, email: userB.email });

      const userBCheck = await userApi.getUser(userB.email);
      const bodyB = await userBCheck.json();

      expect(bodyB.name).toBe(userB.name);
      expect(bodyB.age).toBe(userB.age);
    });
  });
});
