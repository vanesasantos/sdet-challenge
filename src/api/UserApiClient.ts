import { APIRequestContext, APIResponse } from "@playwright/test";
import { CreateUserRequest, UpdateUserRequest } from "../types/User";

export class UserApiClient {
  private readonly request: APIRequestContext;
  private readonly basePath: string;

  constructor(request: APIRequestContext, environment: "dev" | "prod") {
    this.request = request;
    this.basePath = `/${environment}/users`;
  }

  //GET /users
  async listUsers(): Promise<APIResponse> {
    return this.request.get(this.basePath);
  }

  //GET /users/{email}
  async getUser(email: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/${encodeURIComponent(email)}`);
  }

  //POST /users
  async createUser(payload: Partial<CreateUserRequest>): Promise<APIResponse> {
    return this.request.post(this.basePath, { data: payload });
  }

  //PUT /users/{email}
  async updateUser(
    email: string,
    payload: Partial<UpdateUserRequest>,
  ): Promise<APIResponse> {
    return this.request.put(`${this.basePath}/${encodeURIComponent(email)}`, {
      data: payload,
    });
  }

  //DELETE /users/{email}
  async deleteUser(email: string, token?: string): Promise<APIResponse> {
    return this.request.delete(
      `${this.basePath}/${encodeURIComponent(email)}`,
      {
        headers: token ? { Authentication: token } : {},
      },
    );
  }
}
