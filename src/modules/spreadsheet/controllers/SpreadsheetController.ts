import type { Request, Response } from 'express';
// Lembre-se de importar o Service com .js no final para o ESM
import type { ISpreadsheetService } from '../services/interface/ISpreadsheetService.js';

export class SpreadsheetController {
  // No TS, declarar o service no constructor como private já cria a variável automaticamente
  constructor(private spreadsheetService: ISpreadsheetService) {}

    sendMonthlyReport = async (req: Request, res: Response): Promise<Response> => {
      try {
        const { emailEnvio, destinatario, horas, mesVigente } = req.body;

        if (!emailEnvio || !destinatario || !horas || !mesVigente) {
          return res.status(400).json({ 
            message: 'Faltam parâmetros obrigatórios: emailEnvio, destinatario, horas, mesVigente.' 
          });
        }

        await this.spreadsheetService.generateAndSend({
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

    prepareMonth = async (req: Request, res: Response): Promise<Response> => {
      try {
        const { mes, ano } = req.query;

        if (!mes || !ano) {
          return res.status(400).json({ error: 'Mês e ano são obrigatórios.' });
        }

        const dias = await this.spreadsheetService.getFullMonthDays(
          String(mes), 
          Number(ano)
        );

        return res.json(dias);
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }

    generateCustomReport = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { 
        nomeProfissional, 
        nomeEmpresa, 
        mesVigente, 
        destinatario,
        lancamentos 
      } = req.body;

      // Validação básica
      if (!lancamentos || !destinatario) {
        return res.status(400).json({ error: 'Dados insuficientes para gerar e enviar o relatório.' });
      }

      const buffer = await this.spreadsheetService.generateCustomReportAndEmail({
        nomeProfissional,
        nomeEmpresa,
        mesVigente,
        destinatario,
        lancamentos
      });

      // Opcional: Você pode enviar o JSON de sucesso 
      // ou enviar o buffer para download local no app
      return res.status(200).json({ 
        message: 'Planilha gerada e enviada com sucesso para ' + destinatario 
      });

    } catch (error: any) {
      console.error('❌ Erro no fluxo customizado:', error);
      return res.status(500).json({ error: 'Falha ao processar relatório customizado.' });
    }
  }

}