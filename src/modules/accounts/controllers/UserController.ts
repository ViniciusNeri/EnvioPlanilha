import type { Request, Response } from 'express';
import type { IUserService } from '../services//interface/IUserService.js';

export class UserController {

    constructor(private userService: IUserService) {}
  
  // POST /users
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, password, companyName, managerEmail, receiveCopy } = req.body;
      
      await this.userService.create({ name, email, password, companyName, managerEmail, receiveCopy });
      
      return res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // GET /users
  async list(req: Request, res: Response): Promise<Response> {
    try {
      const users = await this.userService.findAll();
      
      // Mapeamos para não retornar a senha, mesmo que o Repository já filtre
      const formattedUsers = users.map(user => {
        const { password, ...rest } = user;
        return rest;
      });

      return res.json(formattedUsers);
    } catch (error: any) {
      return res.status(500).json({ error: "Erro ao listar usuários." });
    }
  }

  // GET /users/:id
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

  // PUT /users/:id
  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const data = req.body; // Partial<User>

      if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: "ID inválido ou não fornecido." });
        }

      await this.userService.update(id, data);

      return res.json({ message: "Usuário atualizado com sucesso!" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}