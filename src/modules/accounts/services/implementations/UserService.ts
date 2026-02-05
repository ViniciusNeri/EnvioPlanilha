import { hash } from 'bcrypt';
import { User } from '../../entities/User.js';
import type { IUserRepository } from '../../repositories/interface/IUserRepository.js';
import type { IUserService } from '../interface/IUserService.js';

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  // CREATE: Lógica de cadastro
  async create({ name, email, password}: User): Promise<void> {
    const userAlreadyExists = await this.userRepository.findByEmail(email);

    if (userAlreadyExists) {
      throw new Error("Usuário já cadastrado com este e-mail.");
    }

    const passwordHash = await hash(password, 8);

    const user = new User();
    Object.assign(user, {
      name,
      email,
      password: passwordHash,
      createdAt: new Date()
    });

    await this.userRepository.create(user);
  }

  // LIST: Retorna todos os usuários
  async findAll(): Promise<User[]> {
    return await this.userRepository.list();
  }

  // FIND BY ID: Busca um usuário específico
  async findById(id: string): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("Usuário não encontrado.");
    }
    return user;
  }

  // UPDATE: Altera dados e trata a nova senha, se houver
  async update(id: string, data: Partial<User>): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    // Se o usuário estiver enviando uma nova senha, precisamos gerar o hash dela
    if (data.password) {
      data.password = await hash(data.password, 8);
    }

    // Se estiver tentando mudar o e-mail, verificamos se já pertence a outro
    if (data.email && data.email !== user.email) {
      const emailExists = await this.userRepository.findByEmail(data.email);
      if (emailExists) {
        throw new Error("Este e-mail já está em uso por outro usuário.");
      }
    }

    await this.userRepository.update(id, data);
  }
}