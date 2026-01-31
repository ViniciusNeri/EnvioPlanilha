// src/controllers/SpreadsheetController.js

class SpreadsheetController {
  constructor(spreadsheetService) {
    this.spreadsheetService = spreadsheetService;
  }

  async sendMonthlyReport(req, res) {
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

    } catch (error) {
      console.error('Erro no Controller:', error);
      return res.status(500).json({ 
        message: 'Erro interno ao processar a planilha.',
        error: error.message 
      });
    }
  }
}

module.exports = SpreadsheetController;