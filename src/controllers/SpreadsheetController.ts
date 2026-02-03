import type { Request, Response } from 'express';
// Lembre-se de importar o Service com .js no final para o ESM
import { SpreadsheetService } from '../services/SpreadsheetService.js';

export class SpreadsheetController {
  // No TS, declarar o service no constructor como private já cria a variável automaticamente
  constructor(private spreadsheetService: SpreadsheetService) {}

  async sendMonthlyReport(req: Request, res: Response): Promise<Response> {
    try {
      const { emailEnvio, destinatario, horas, mesVigente } = req.body;

      if (!emailEnvio || !destinatario || !horas || !mesVigente) {
        return res.status(400).json({ 
          message: 'Faltam parâmetros obrigatórios: emailEnvio, destinatario, horas, mesVigente.' 
        });
      }

      await this.spreadsheetService.generateAndSend({
        emailEnvio,
        destinatario,
        horas,
        mesVigente
      });

      return res.status(200).json({ 
        message: `Planilha de ${mesVigente} enviada com sucesso para ${destinatario}!` 
      });

    } catch (error: any) {
      console.error('Erro no Controller:', error);
      return res.status(500).json({ 
        message: 'Erro interno ao processar a planilha.',
        error: error.message 
      });
    }
  }
}