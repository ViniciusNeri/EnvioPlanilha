import { compare } from 'bcrypt';
import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
import type { IUserRepository } from '../../repositories/interface/IUserRepository.js';
import type { IAuthenticateUserService, IAuthenticateResponse } from '../interface/IAuthenticateUserService.js';
import type { IUserService } from '../interface/IUserService.js';  
import type { Signup} from '../../entities/Signup.js';
import { User } from '../../entities/User.js';
import type { IMailProvider } from '../../../../providers/MailProvider/interface/IMailProvider.js';


export class AuthenticateUserService implements IAuthenticateUserService {
  constructor(
    private userRepository: IUserRepository,
    private mailProvider: IMailProvider,
    private userService: IUserService
  ) {}

  async execute(email: string, password: string): Promise<IAuthenticateResponse> {
    const user = await this.userRepository.findByEmail(email);
    const passwordAsString = String(password);

    if (!user) {
      throw new Error("E-mail ou senha incorretos.");
    }

    const passwordMatch = await compare(passwordAsString, user.password);

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

    async signup(data: User): Promise<Signup> {
    const userAlreadyExists = await this.userRepository.findByEmail(data.email);
    if (userAlreadyExists) {
      throw new Error("Usuário já cadastrado com este e-mail.");
    }

    const code = this.generateVerificationCode();
    const secretKey = process.env.JWT_SECRET_KEY;

    if (!secretKey) {
      throw new Error("Chave secreta do JWT não configurada no ambiente.");
    }
    const token = sign({ ...data, code }, secretKey, { expiresIn: '15m' });
    await this.sendEmail(data, code);
    return {token, code}; 
  }

  // Helper para gerar o código (deixa o método principal mais limpo)
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async signupWithCode(signup: Signup): Promise<IAuthenticateResponse> {
    const secretKey = process.env.JWT_SECRET_KEY;

    if (!secretKey) {
      throw new Error("Chave secreta do JWT não configurada no ambiente.");
    }
    try {
      const decoded = verify(signup.token, secretKey) as any;
      const { code: codeInToken, iat, exp, ...userData } = decoded;

      if (signup.code !== codeInToken) {
        throw new Error("Código de verificação inválido.");
      }

      await this.userService.create(userData);

      return this.execute(userData.email, String(userData.password));

    } catch (error) {
      throw new Error("Token inválido ou expirado.");
    }
  }

  private async sendEmail(user: User, code: string): Promise<void> {   

    await this.mailProvider.sendMail({
      to: user.email,
      copy: "", // Exemplo de uso dos seus parâmetros
      subject: `Código de verificação - ${user.name}`,
      body: this.buildEmailBody(user.name, code)
    });

  }

  private buildEmailBody(name: string, code: string): string {
    return `Olá ${name},\n\nUse o código abaixo para completar seu cadastro:\n\n` +
          `${code}\n\n` +
          `Este código é válido por 15 minutos.\n\n` +
          `Atenciosamente,\nEquipe HourFlow`;
  }

}