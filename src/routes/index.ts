// src/routes/index.ts
import type { Request, Response } from 'express';
import { Router } from 'express';
import { spreadsheetController } from '../shared/container.js'; 

const routes = Router();
// Health check
routes.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

// Rota principal
// Usamos o bind para garantir que o 'this' dentro do controller não se perca
routes.post('/enviar-planilha', (req, res) => spreadsheetController.sendMonthlyReport(req, res));

export { routes };