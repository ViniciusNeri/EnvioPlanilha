// src/services/SpreadsheetService.js
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');

class SpreadsheetService {

async generateAndSend({ emailEnvio, destinatario, horas, mesVigente }) {
    // 1. Criar a Planilha em memória
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Horas Mensais');

    // Configurar colunas
    sheet.columns = [
      { header: 'Mês', key: 'mes', width: 20 },
      { header: 'Quantidade de Horas', key: 'horas', width: 25 },
      { header: 'Data de Geração', key: 'data', width: 25 },
    ];

    // Adicionar os dados recebidos do Flutter
    sheet.addRow({
      mes: mesVigente,
      horas: horas,
      data: new Date().toLocaleDateString('pt-BR'),
    });

    // Estilizar o cabeçalho (opcional, para ficar bonito)
    sheet.getRow(1).font = { bold: true };

    // 2. Gerar o Buffer (o arquivo em formato de bytes, sem salvar no disco)
    const buffer = await workbook.xlsx.writeBuffer();

    // 3. Configurar o Transporte de E-mail (SMTP)
    // DICA: Use as variáveis do seu arquivo .env aqui!
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 4. Enviar o E-mail com o anexo
    await transporter.sendMail({
      from: `"Sistema de Planilhas" <${emailEnvio}>`,
      to: destinatario,
      subject: `Planilha de Horas - ${mesVigente}`,
      text: `Olá, segue em anexo a planilha de horas referente ao mês de ${mesVigente}. Total: ${horas}h.`,
      attachments: [
        {
          filename: `Planilha_Horas_${mesVigente}.xlsx`,
          content: buffer,
        },
      ],
    });
  }
}

module.exports = SpreadsheetService;