import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateController, spreadsheetController, userController } from '../shared/container/container.js'; 
import { ensureAuthenticated } from '../shared/infra/http/middlewares/ensureAuthenticated.js';

const routes = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags:
 *       - Sistema
 *     responses:
 *       200:
 *         description: OK
 */
routes.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

/**
 * @openapi
 * /spreadsheet/send:
 *   post:
 *     summary: Faz o envio da planilha mensal
 *     tags:
 *       - Planilhas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               horas:
 *                 type: number
 *               mesVigente:
 *                 type: string
 *             required:
 *               - horas
 *               - mesVigente
 *     responses:
 *       200:
 *         description: Planilha enviada com sucesso
 *       400:
 *         description: Parâmetros obrigatórios ausentes
 *       401:
 *         description: Usuário não autenticado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno
 */
routes.post('/spreadsheet/send', ensureAuthenticated, (req, res) =>
  spreadsheetController.sendMonthlyReport(req, res)
);

/**
 * @openapi
 * /spreadsheet/prepare:
 *   get:
 *     summary: Prepara dados da planilha
 *     tags:
 *       - Planilhas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mes
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: ano
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de dias do mês
 *       400:
 *         description: Mês e ano são obrigatórios
 *       401:
 *         description: Usuário não autenticado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno
 */
routes.get('/spreadsheet/prepare', ensureAuthenticated, (req, res) =>
  spreadsheetController.prepareMonth(req, res)
);

/**
 * @openapi
 * /spreadsheet/custom:
 *   post:
 *     summary: Gera planilha personalizada
 *     tags:
 *       - Planilhas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mesVigente:
 *                 type: string
 *               lancamentos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dia:
 *                       type: string
 *                       format: date
 *                     horas:
 *                       type: number
 *             required:
 *               - mesVigente
 *               - lancamentos
 *     responses:
 *       200:
 *         description: Planilha personalizada enviada com sucesso
 *       400:
 *         description: Dados insuficientes
 *       401:
 *         description: Usuário não autenticado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno
 */
routes.post('/spreadsheet/custom', ensureAuthenticated, (req, res) =>
  spreadsheetController.generateCustomReport(req, res)
);

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Cria um novo usuário
 *     tags:
 *       - Usuários
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               companyName:
 *                 type: string
 *               managerEmail:
 *                 type: string
 *                 format: email
 *               receiveCopy:
 *                 type: boolean
 *             required:
 *               - name
 *               - email
 *               - password
 *               - companyName
 *               - managerEmail
 *               - receiveCopy
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Erro ao criar usuário
 *   get:
 *     summary: Lista usuários
 *     tags:
 *       - Usuários
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       500:
 *         description: Erro ao listar usuários
 */
routes.post('/users', (req, res) => userController.create(req, res));
routes.get('/users', (req, res) => userController.list(req, res));

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Detalhes do usuário
 *     tags:
 *       - Usuários
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Usuário não encontrado
 *   put:
 *     summary: Atualiza usuário
 *     tags:
 *       - Usuários
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               companyName:
 *                 type: string
 *               managerEmail:
 *                 type: string
 *                 format: email
 *               receiveCopy:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       400:
 *         description: Erro ao atualizar usuário
 */
routes.get('/users/:id', (req, res) => userController.show(req, res));
routes.put('/users/:id', (req, res) => userController.update(req, res));

/**
 * @openapi
 * /auth/sessions:
 *   post:
 *     summary: Login
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login realizado
 *       400:
 *         description: Credenciais inválidas
 */
routes.post('/auth/sessions', (req, res) => authenticateController.handle(req, res));

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Cadastro
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               companyName:
 *                 type: string
 *               managerEmail:
 *                 type: string
 *                 format: email
 *               receiveCopy:
 *                 type: boolean
 *             required:
 *               - name
 *               - email
 *               - password
 *               - companyName
 *               - managerEmail
 *               - receiveCopy
 *     responses:
 *       200:
 *         description: Código de verificação enviado
 *       400:
 *         description: Dados incompletos
 */
routes.post('/auth/signup', (req, res) => authenticateController.signup(req, res));

/**
 * @openapi
 * /auth/signup/confirm:
 *   post:
 *     summary: Confirma cadastro
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               code:
 *                 type: string
 *             required:
 *               - token
 *               - code
 *     responses:
 *       201:
 *         description: Cadastro confirmado com sucesso
 *         content:
 *           application/json:
 *             example:
 *               status: "success"
 *               message: "Cadastro confirmado com sucesso! Você já pode realizar o login."
 *       400:
 *         description: Dados insuficientes ou erro interno
 *       401:
 *         description: Token ou código inválido/expirado
 */
routes.post('/auth/signup/confirm', (req, res) => authenticateController.confirmSignup(req, res));

export { routes };
