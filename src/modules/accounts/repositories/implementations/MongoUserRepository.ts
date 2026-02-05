import { User } from '../../entities/User.js';
import type { IUserRepository } from '../../repositories/interface/IUserRepository.js';
import { UserModel } from '../../infra/database/mongoose/schemas/User.js';

export class MongoUserRepository implements IUserRepository {
  
  async create(user: User): Promise<void> {
    await UserModel.create(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email });
    return user ? user.toObject() : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findOne({ id });
    return user ? user.toObject() : null;
  }

  async list(): Promise<User[]> {
    const users = await UserModel.find().select('-password'); // Exclui a senha da listagem
    return users.map(user => user.toObject());
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    await UserModel.updateOne({ id }, { $set: data });
  }
}