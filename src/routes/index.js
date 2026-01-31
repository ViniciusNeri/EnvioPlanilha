// src/routes/index.js
const { Router } = require('express');
const SpreadsheetService = require('../services/SpreadsheetService');
const SpreadsheetController = require('../controllers/SpreadsheetController');

const routes = Router();

// Injeção de dependência
const spreadsheetService = new SpreadsheetService();
const spreadsheetController = new SpreadsheetController(spreadsheetService);

// Health check para monitorar se a API está online
routes.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// Rota principal
routes.post('/enviar-planilha', (req, res) => spreadsheetController.sendMonthlyReport(req, res));

module.exports = routes;