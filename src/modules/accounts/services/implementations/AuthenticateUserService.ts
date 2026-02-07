import { compare } from 'bcrypt';
import pkg from 'jsonwebtoken';
const { sign } = pkg;
import type { IUserRepository } from '../../repositories/interface/IUserRepository.js';
import type { IAuthenticateUserService, IAuthenticateResponse } from '../interface/IAuthenticateUserService.js';

export class AuthenticateUserService implements IAuthenticateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute(email: string, password: string): Promise<IAuthenticateResponse> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error("E-mail ou senha incorretos.");
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      throw new Error("E-mail ou senha incorretos.");
    }

    // Gerando o Token JWT
    const token = sign({}, process.env.JWT_SECRET_KEY as string, {
      subject: user.id,
      expiresIn: "1d",
    });

    return {
      user: {
        name: user.name,
        email: user.email,
        id: user.id!,
      },
      token,
    };
  }
}