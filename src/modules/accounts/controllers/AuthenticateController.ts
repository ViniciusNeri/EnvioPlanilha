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
}