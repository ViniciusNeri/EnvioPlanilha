import { hash } from 'bcrypt';
import { User } from '../../entities/User.js';
import type { IUserRepository } from '../../repositories/interface/IUserRepository.js';
import type { IUserService } from '../interface/IUserService.js';
import type { IMailProvider } from '../../../../providers/MailProvider/interface/IMailProvider.js';
import type { Signup} from '../../entities/Signup.js';
import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;



export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository, 
    private mailProvider: IMailProvider
  ){}



  async create({ name, email, password, companyName, managerEmail, receiveCopy}: User): Promise<void> {
    const userAlreadyExists = await this.userRepository.findByEmail(email);

    if (userAlreadyExists) {
      throw new Error("Usuário já cadastrado com este e-mail.");
    }

    const passwordHash = await hash(String(password), 8);

    const user = new User();
    Object.assign(user, {
      name,
      email,
      password: passwordHash,
      companyName,
      managerEmail,
      receiveCopy,
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

  async signup(data: User): Promise<Signup> {
    // 1. Validação Antecipada (Fail Fast)
    const userAlreadyExists = await this.userRepository.findByEmail(data.email);
    if (userAlreadyExists) {
      throw new Error("Usuário já cadastrado com este e-mail.");
    }

    // 2. Lógica de Geração de Código e Token
    const code = this.generateVerificationCode();
    const secretKey = process.env.JWT_SECRET_KEY;

    if (!secretKey) {
      throw new Error("Chave secreta do JWT não configurada no ambiente.");
    }

    // O payload deve conter os dados, mas evite colocar a senha bruta no JWT se possível
    const token = sign({ ...data, code }, secretKey, { expiresIn: '15m' });

    // 3. Ações Externas (E-mail)
    await this.sendEmail(data, code);

    return {token, code}; 
  }

  // Helper para gerar o código (deixa o método principal mais limpo)
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async signupWithCode(signup: Signup): Promise<void> {
    const secretKey = process.env.JWT_SECRET_KEY;

    if (!secretKey) {
      throw new Error("Chave secreta do JWT não configurada no ambiente.");
    }

    try {
      const decoded = verify(signup.token, secretKey) as any;
      const { code: codeInToken, iat, exp, ...userData } = decoded;

      // Verifica se o código é válido (simulando verificação)
      if (signup.code !== codeInToken) {
        throw new Error("Código de verificação inválido.");
      }

      // Marca o usuário como verificado
      await this.create(userData);

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