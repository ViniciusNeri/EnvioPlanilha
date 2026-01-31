// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

class App {
  constructor() {
    this.server = express();
    
    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(cors());
    this.server.use(express.json());
  }

  routes() {
    // Definimos um prefixo para a API (versão 1)
    this.server.use('/api/v1', routes);
  }

  exceptionHandler() {
    // Middleware de erro global para evitar crash do servidor
    this.server.use((err, req, res, next) => {
      console.error('❌ Erro Crítico:', err.stack);
      return res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    });
  }
}

const app = new App().server;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(40));
  console.log(`🚀 SERVIDOR INICIADO COM SUCESSO`);
  console.log(`📡 URL: http://localhost:${PORT}/api/v1`);
  console.log(`📂 Rota: /enviar-planilha`);
  console.log('='.repeat(40) + '\n');
});