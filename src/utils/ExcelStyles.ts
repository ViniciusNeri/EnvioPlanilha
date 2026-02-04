import type { IMailProvider } from '../providers/MailProvider/interface/IMailProvider.js';
import ExcelJS from 'exceljs';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isWeekend, 
  format 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IGenerateAndSendDTO {
  emailEnvio: string;
  destinatario: string;
  horas: number;
  mesVigente: string; // Ex: "Janeiro" ou "01"
}

export class SpreadsheetService {
  constructor(private mailProvider: IMailProvider) {}

  async generateAndSend({ emailEnvio, destinatario, horas, mesVigente }: IGenerateAndSendDTO): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Horas - ${mesVigente}`);

    // 1. Configurar Colunas
    sheet.columns = [
      { header: 'DATA', key: 'data', width: 15 },
      { header: 'DIA DA SEMANA', key: 'diaSemana', width: 20 },
      { header: 'HORAS TRABALHADAS', key: 'horasDia', width: 20 },
    ];

    // 2. Lógica para calcular dias úteis
    // Precisamos de um objeto Date para o mês. Ex: Janeiro de 2024
    const anoAtual = new Date().getFullYear();
    const mesesMap: { [key: string]: number } = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
      'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
    };
    
    const numeroMes = mesesMap[mesVigente.toLowerCase()]!;

    if (numeroMes === undefined) {
    throw new Error(`Mês inválido informado: ${mesVigente}`);
    }
    const dataBase = new Date(anoAtual, numeroMes, 1);
    
    const diasDoMes = eachDayOfInterval({
      start: startOfMonth(dataBase),
      end: endOfMonth(dataBase)
    });

    const diasUteis = diasDoMes.filter(dia => !isWeekend(dia));
    
    // 3. Distribuir horas
    const horasPorDia = Math.floor(horas / diasUteis.length);
    let horasRestantes = horas % diasUteis.length;

    // 4. Preencher a planilha dia a dia
    diasDoMes.forEach(dia => {
      const eFimDeSemana = isWeekend(dia);
      let horasLancadas = 0;

      if (!eFimDeSemana) {
        horasLancadas = horasPorDia;
        if (horasRestantes > 0) {
          horasLancadas += 1;
          horasRestantes--;
        }
      }

      sheet.addRow({
        data: format(dia, 'dd/MM/yyyy'),
        diaSemana: format(dia, 'eeee', { locale: ptBR }).toUpperCase(),
        horasDia: horasLancadas > 0 ? horasLancadas : '-'
      });
    });

    // 5. Aplicar Estilos (Aqui você chamaria o seu ExcelFormatter)
    this.applyStyles(sheet);

    const buffer = await workbook.xlsx.writeBuffer();

    await this.mailProvider.sendMail({
      to: destinatario,
      subject: `Relatório de Horas - ${mesVigente}`,
      body: `<p>Segue em anexo o relatório detalhado de <strong>${mesVigente}</strong>.</p>`,
      attachments: [{
        name: `Relatorio_Horas_${mesVigente}.xlsx`,
        content: buffer as any,
      }]
    });
  }

  private applyStyles(sheet: ExcelJS.Worksheet) {
    // Estilo básico de cabeçalho
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  }
}