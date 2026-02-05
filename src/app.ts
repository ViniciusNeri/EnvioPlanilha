import express from 'express';
import type { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { routes } from './routes/index.js';
import mongoose from 'mongoose';

class App {
  public server: Application;

  constructor() {
    this.server = express();
    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  private middlewares(): void {
    this.server.use(cors());
    this.server.use(express.json());
  }

  private routes(): void {
    this.server.use('/api/v1', routes);
  }

  private exceptionHandler(): void {
    this.server.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('❌ Erro Crítico:', err.stack);
      res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    });
  }
}

// Função principal para iniciar a aplicação
async function startApp() {
  try {
    // 1. Conecta ao Banco Primeiro
    await mongoose.connect(process.env.MONGO_URL as string);
    console.log('🍃 MongoDB conectado com sucesso!');

    // 2. Só instancia o App e inicia o listen após o banco estar OK
    const app = new App().server;
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(40));
      console.log(`🚀 SERVIDOR TS INICIADO`);
      console.log(`📡 URL: http://localhost:${PORT}/api/v1`);
      console.log(`📂 Rota: /enviar-planilha`);
      console.log('='.repeat(40) + '\n');
    });

  } catch (error) {
    console.error('❌ Falha ao iniciar aplicação:', error);
    process.exit(1);
  }
}

startApp();