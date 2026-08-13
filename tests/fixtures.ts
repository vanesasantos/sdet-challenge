import { test as base, expect } from "@playwright/test";
import { UserApiClient } from "../src/api/UserApiClient";

type Fixtures = { userApi: UserApiClient };
const targetEnv = (process.env.TARGET_ENV ?? "dev") as "dev" | "prod";

export const test = base.extend<Fixtures>({
  userApi: async ({ request }, use) => {
    await use(new UserApiClient(request, targetEnv));
  },
});

export { expect };
