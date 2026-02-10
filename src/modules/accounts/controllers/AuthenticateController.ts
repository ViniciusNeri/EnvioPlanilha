import type { Request, Response } from 'express';
import type { IAuthenticateUserService } from '../services/interface/IAuthenticateUserService.js';

export class AuthenticateController {
  constructor(private authenticateUserService: IAuthenticateUserService) {}

  async handle(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    try {
      const result = await this.authenticateUserService.execute(email, password);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async signup(req: Request, res: Response): Promise<Response> {
  try {
    const userData = req.body;
    
    const requiredFields = [
      'email', 'password', 'name', 'companyName', 'managerEmail', 'receiveCopy'
    ];

    const missingFields = requiredFields.filter(
      field => userData[field] === undefined || userData[field] === null || userData[field] === ''
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Dados incompletos. Campos ausentes: ${missingFields.join(', ')}`
      });
    }

    const { token } = await this.authenticateUserService.signup(userData);

    return res.status(200).json({
      status: "success",
      message: "Código de verificação enviado para o seu e-mail.",
      data: { token } 
    });

  } catch (error: any) {
    console.error(`[Signup Request Error]: ${error.message}`);      
    return res.status(400).json({
      status: "error",
      message: error.message || "Erro ao processar solicitação de cadastro."
    });
  }
 }

  async confirmSignup(req: Request, res: Response): Promise<Response> {
    const { token, code } = req.body;

    if (!token || !code) {
      return res.status(400).json({ 
        error: "Dados insuficientes.", 
        message: "Token e código são obrigatórios para confirmar o cadastro." 
      });
    }

    try {

      const result = await this.authenticateUserService.signupWithCode({ token, code });

      return res.status(201).json({ 
        status: "success",
        message: "Cadastro confirmado com sucesso! Você já pode realizar o login.",
        data: result
      });

    } catch (error: any) {
      const errorMessage = error.message || "Erro interno ao confirmar cadastro.";      
      console.error(`[Signup Confirmation Error]: ${errorMessage}`);
      const statusCode = errorMessage.includes("expirado") || errorMessage.includes("inválido") 
        ? 401 
        : 400;
      return res.status(statusCode).json({ 
        status: "error",
        message: errorMessage 
      });
    }
  }
}