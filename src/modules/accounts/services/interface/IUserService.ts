import type { Signup } from '../../entities/Signup.js';
import { User } from '../../entities/User.js';

export interface IUserService {
  create(data: User): Promise<void>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<void>;
  signup(data: User): Promise<Signup>;
  signupWithCode(signup: Signup): Promise<void>;
}