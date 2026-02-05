// src/routes/index.ts
import type { Request, Response } from 'express';
import { Router } from 'express';
import { spreadsheetController, userController } from '../shared/container.js'; 

const routes = Router();
// Health check
routes.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});


routes.post('/enviar-planilha', spreadsheetController.sendMonthlyReport);
routes.post('/gerar-customizado', spreadsheetController.generateCustomReport);

routes.get('/preparar-mes', spreadsheetController.prepareMonth);

// Rotas de Usuário (CRUD)
routes.post('/users', (req, res) => userController.create(req, res));
routes.get('/users', (req, res) => userController.list(req, res));
routes.get('/users/:id', (req, res) => userController.show(req, res));
routes.put('/users/:id', (req, res) => userController.update(req, res));


export { routes };