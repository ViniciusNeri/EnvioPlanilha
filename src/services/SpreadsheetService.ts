import type { IMailProvider } from '../providers/MailProvider/models/IMailProvider.js';
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

    const anoAtual = new Date().getFullYear();
    
    // Remove barras ou caracteres que o Excel não aceita para o nome da aba
    const nomeMesLimpo = mesVigente.replace(/[/\\?*:[\]]/g, '-');
    const nomeDaAba = `Horas - ${nomeMesLimpo} ${anoAtual}`;

    const sheet = workbook.addWorksheet(`Horas - ${nomeDaAba}`)

    // 1. Configurar Colunas
    sheet.columns = [
      { header: 'DATA', key: 'data', width: 15 },
      { header: 'DIA DA SEMANA', key: 'diaSemana', width: 20 },
      { header: 'HORAS TRABALHADAS', key: 'horasDia', width: 20 },
    ];

    // 2. Lógica para calcular dias úteis
    // Precisamos de um objeto Date para o mês. Ex: Janeiro de 2024
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

    // 1. Adiciona uma linha vazia para separar (opcional)
    sheet.addRow({});

    // 2. Adiciona a linha totalizadora
    const totalRow = sheet.addRow({
      data: '', 
      diaSemana: 'TOTAL DE HORAS NO MÊS',
      horasDia: horas // Aqui usamos o valor total que veio no parâmetro do método
    });

    // 3. Estilização da linha total
    totalRow.font = { bold: true, size: 12 };

    // Pegamos a célula específica da coluna de horas (coluna C ou 3)
    const totalCell = totalRow.getCell('horasDia');

    totalCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' }, // Amarelo para destacar o total
    };

    totalCell.border = {
      top: { style: 'double' }, // Linha dupla em cima para indicar soma
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Alinhamento para o texto "TOTAL DE HORAS..." ficar à direita e encostar no valor
    totalRow.getCell('diaSemana').alignment = { horizontal: 'left' };

    // 5. Aplicar Estilos (Aqui você chamaria o seu ExcelFormatter)
    this.applyStyles(sheet);

    const buffer = await workbook.xlsx.writeBuffer();

    await this.mailProvider.sendMail({
      to: destinatario,
      subject: `Relatório de Horas - ${mesVigente}`,
      body: `<p>Segue em anexo o relatório detalhado de <strong>${mesVigente}</strong>.</p>`,
      attachments: [{
        name: `relatorio.xlsx`,
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