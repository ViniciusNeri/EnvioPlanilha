import { User } from '../../entities/User.js';

export interface IUserService {
  create(data: User): Promise<void>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<void>;
}