import { test as base } from "@playwright/test";
import { UserApiClient } from "../src/api/UserApiClient";

type MyFixtures = {
  userApi: UserApiClient;
};

export const test = base.extend<MyFixtures>({
  userApi: async ({ request }, use, testInfo) => {
    const env =
      (testInfo.project.metadata.environment as "dev" | "prod") || "dev";
    const client = new UserApiClient(request, env);

    await use(client);
  },
});

export { expect } from "@playwright/test";
