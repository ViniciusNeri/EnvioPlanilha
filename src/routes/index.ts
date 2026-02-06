// src/routes/index.ts
import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateController, spreadsheetController, userController } from '../shared/container/container.js'; 
import { ensureAuthenticated } from '../shared/infra/http/middlewares/ensureAuthenticated.js';

const routes = Router();
// Health check
routes.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});


routes.post('/spreadsheet/send', ensureAuthenticated, (req, res) => 
  spreadsheetController.sendMonthlyReport(req, res)
);
routes.get('/spreadsheet/prepare', ensureAuthenticated, (req, res) => 
  spreadsheetController.prepareMonth(req, res)
);
routes.post('/spreadsheet/custom', ensureAuthenticated, (req, res) => 
  spreadsheetController.generateCustomReport(req, res)
);

routes.post('/users', (req, res) => userController.create(req, res));
routes.get('/users', (req, res) => userController.list(req, res));
routes.get('/users/:id', (req, res) => userController.show(req, res));
routes.put('/users/:id', (req, res) => userController.update(req, res));

routes.post('/sessions', (req, res) => authenticateController.handle(req, res));




export { routes };