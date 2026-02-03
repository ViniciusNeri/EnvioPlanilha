import express from 'express';
// Use "import type" para os tipos do Express
import type { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { routes } from './routes/index.js';

class App {
  // Declaramos o tipo da propriedade server
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
    // Agora usando o prefixo v1 com as rotas que exportamos como objeto
    this.server.use('/api/v1', routes);
  }

  private exceptionHandler(): void {
    this.server.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('❌ Erro Crítico:', err.stack);
      res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    });
  }
}

// Instanciamos a classe e exportamos o servidor express
const app = new App().server;

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(40));
  console.log(`🚀 SERVIDOR TS INICIADO`);
  console.log(`📡 URL: http://localhost:${PORT}/api/v1`);
  console.log(`📂 Rota: /enviar-planilha`);
  console.log('='.repeat(40) + '\n');
});