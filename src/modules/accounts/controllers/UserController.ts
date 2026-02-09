import type { Request, Response } from 'express';
import type { IUserService } from '../services//interface/IUserService.js';

export class UserController {

    constructor(private userService: IUserService) {}
  
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, password, companyName, managerEmail, receiveCopy } = req.body;
      
      await this.userService.create({ name, email, password, companyName, managerEmail, receiveCopy });
      
      return res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const users = await this.userService.findAll();
      
      const formattedUsers = users.map(user => {
        const { password, ...rest } = user;
        return rest;
      });

      return res.json(formattedUsers);
    } catch (error: any) {
      return res.status(500).json({ error: "Erro ao listar usuários." });
    }
  }

  async show(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: "ID inválido ou não fornecido." });
        }

      const user = await this.userService.findById(id);

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const data = req.body; 

      if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: "ID inválido ou não fornecido." });
        }

      await this.userService.update(id, data);

      return res.json({ message: "Usuário atualizado com sucesso!" });
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

      const { token } = await this.userService.signup(userData);

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

      await this.userService.signupWithCode({ token, code });

      return res.status(201).json({ 
        status: "success",
        message: "Cadastro confirmado com sucesso! Você já pode realizar o login." 
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