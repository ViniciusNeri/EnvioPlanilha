import { User } from '../../entities/User.js';

export interface IUserRepository {
  create(data: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  list(): Promise<User[]>; 
  update(id: string, data: Partial<User>): Promise<void>; 

}