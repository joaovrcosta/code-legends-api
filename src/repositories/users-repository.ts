import { User } from "@prisma/client";

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  avatar?: string | null;
}

export interface IUsersRepository {
  create(data: CreateUserData): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIdWithAddress(id: string): Promise<(User & { Address?: any }) | null>;
  findAll(): Promise<User[]>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
