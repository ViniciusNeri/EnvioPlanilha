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
      copy: "", 
      subject: `Código de verificação - ${user.name}`,
      body: this.buildEmailBody(user.name, code)
    });

  }

  private buildEmailBody(name: string, code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="400" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #6A11CB 0%, #2575FC 100%); height: 8px;"></td>
                </tr>

                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Olá, ${name}!</h2>
                    <p style="color: #64748b; font-size: 16px; line-height: 1.5; margin: 0;">
                      Seja bem-vindo ao <strong>HourFlow</strong>. Use o código de verificação abaixo para completar seu cadastro:
                    </p>
                    
                    <div style="margin: 30px 0; padding: 20px; background-color: #f1f5f9; border-radius: 12px; border: 2px dashed #cbd5e1;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: bold; color: #2575FC; letter-spacing: 8px;">
                        ${code}
                      </span>
                    </div>

                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                      Este código expira em <strong style="color: #64748b;">15 minutos</strong>.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 30px 40px 30px; text-align: center;">
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        Atenciosamente,<br>
                        <strong style="color: #1e293b;">Equipe HourFlow</strong>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
}

}