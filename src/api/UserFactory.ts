import { CreateUserRequest } from "../types/User";

export class UserFactory {
  static build(overrides: Partial<CreateUserRequest> = {}): CreateUserRequest {
    const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    return {
      name: "Test User",
      email: `qa.${unique}@example.com`,
      age: 30,
      ...overrides,
    };
  }
}
