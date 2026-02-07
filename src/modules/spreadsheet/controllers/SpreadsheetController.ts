import type { Request, Response } from 'express';
import type { ISpreadsheetService } from '../services/interface/ISpreadsheetService.js';
import type { IUserService } from '../../accounts/services/interface/IUserService.js';

export class SpreadsheetController {
  constructor(private spreadsheetService: ISpreadsheetService, private userService: IUserService) {}

    sendMonthlyReport = async (req: Request, res: Response): Promise<Response> => {
      try {
        const { horas, mesVigente } = req.body;

        const userId = req.user.id;

        if (!userId) {
          return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        const user = await this.userService.findById(userId);

        if (!user) {
          return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        if (!horas || !mesVigente) {
          return res.status(400).json({ 
            message: 'Faltam parâmetros obrigatórios: horas, mesVigente.' 
          });
        }

        await this.spreadsheetService.generateAndSend({
          user,
          horas,
          mesVigente
        });

        return res.status(200).json({ 
          message: `Planilha de ${mesVigente} enviada com sucesso para ${user.managerEmail}!` 
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

        const userId = req.user.id;

        if (!userId) {
          return res.status(401).json({ message: 'Usuário não autenticado.' });
        }
        
        const user = await this.userService.findById(userId);

        if (!user) {
          return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

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
        mesVigente, 
        lancamentos 
      } = req.body;

      const userId = req.user.id;

        if (!userId) {
          return res.status(401).json({ message: 'Usuário não autenticado.' });
        }
        
        const user = await this.userService.findById(userId);

        if (!user) {
          return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

      // Validação básica
      if (!lancamentos || !mesVigente) {
        return res.status(400).json({ error: 'Dados insuficientes para gerar e enviar o relatório.' });
      }

      const buffer = await this.spreadsheetService.generateCustomReportAndEmail({
        user,
        mesVigente,
        lancamentos
      });

      // Opcional: Você pode enviar o JSON de sucesso 
      // ou enviar o buffer para download local no app
      return res.status(200).json({ 
        message: 'Planilha gerada e enviada com sucesso para ' + user.managerEmail!
      });

    } catch (error: any) {
      console.error('❌ Erro no fluxo customizado:', error);
      return res.status(500).json({ error: 'Falha ao processar relatório customizado.' });
    }
  }

}