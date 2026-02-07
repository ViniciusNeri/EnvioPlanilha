import type { Request, Response, NextFunction } from 'express';
import pkg from 'jsonwebtoken';
const { verify } = pkg;

interface IPayload {
  sub: string;
}

export function ensureAuthenticated(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  // O formato é "Bearer <token>", então dividimos pelo espaço
  const [, token] = authHeader.split(" ");

  try {
    // A chave secreta deve ser a mesma usada no AuthenticateUserService

    if (token === undefined) {
      throw new Error(`Token inválido ou não fornecido.`);    
    }
    const { sub: user_id } = verify(token, process.env.JWT_SECRET_KEY as string) as IPayload;

    // Injetamos o ID do usuário no Request para uso futuro
    req.user = {
      id: user_id,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}