export interface User {
  name: string;
  email: string;
  age: number;
}

export type CreateUserRequest = User;
export type UpdateUserRequest = User;
