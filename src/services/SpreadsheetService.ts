import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isWeekend, 
  format 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { IMailProvider } from '../providers/MailProvider/interface/IMailProvider.js';
import type { IHolidayRepository } from '../repositories/interface/IHolidayRepository.js';
import { ExcelProvider } from '../providers/ExcelProvider/ExcelProvider.js';

interface IGenerateAndSendDTO {
  destinatario: string;
  horas: number;
  mesVigente: string;
}

export class SpreadsheetService {
  // Recebemos as instâncias diretamente no constructor (Injeção manual)
  constructor(
    private mailProvider: IMailProvider,
    private excelProvider: ExcelProvider,
    private holidayRepository: IHolidayRepository
  ) {}

  async generateAndSend({ destinatario, horas, mesVigente }: IGenerateAndSendDTO): Promise<void> {
    const anoAtual = new Date().getFullYear();
    
    // 1. Mapeamento de Meses
    const mesesMap: Record<string, number> = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
      'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
    };

    const numeroMes = mesesMap[mesVigente.toLowerCase()];

    if (numeroMes === undefined) {
      throw new Error(`Mês inválido informado: ${mesVigente}`);
    }

    // 2. Lógica de Datas e Feriados
    const dataBase = new Date(anoAtual, numeroMes, 1);
    const diasDoMes = eachDayOfInterval({
      start: startOfMonth(dataBase),
      end: endOfMonth(dataBase)
    });

    const feriadosNacionais = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];

    const diasTrabalho = diasDoMes.filter(dia => {
      const eFds = isWeekend(dia);
      const eFer = feriadosNacionais.includes(format(dia, 'MM-dd'));
      return !eFds && !eFer;
    });

    // 3. Distribuição de Horas
    const horasPorDia = Math.floor(horas / diasTrabalho.length);
    let horasRestantes = horas % diasTrabalho.length;

    // 4. Preparação dos dados
    const linhasParaPlanilha = diasDoMes.map(dia => {
      const dataFormatada = format(dia, 'MM-dd');
      const eFds = isWeekend(dia);
      const eFer = feriadosNacionais.includes(dataFormatada);
      
      let label: string | number = '-';

      if (!eFds && !eFer) {
        const horasLancadas = horasPorDia + (horasRestantes > 0 ? 1 : 0);
        if (horasRestantes > 0) horasRestantes--;
        label = horasLancadas;
      } else if (eFer) {
        label = 'FERIADO';
      }

      return {
        data: format(dia, 'dd/MM/yyyy'),
        diaSemana: format(dia, 'eeee', { locale: ptBR }).toUpperCase(),
        horasDia: label
      };
    });

    // 5. Geração do Buffer via ExcelProvider
    const nomeMesSeguro = mesVigente.replace(/[/\\?*:[\]]/g, '-');
    const nomeAba = `Horas - ${nomeMesSeguro} ${anoAtual}`;
    
    const colunas = [
      { header: 'DATA', key: 'data', width: 15 },
      { header: 'DIA DA SEMANA', key: 'diaSemana', width: 20 },
      { header: 'HORAS TRABALHADAS', key: 'horasDia', width: 22 },
    ];

    const buffer = await this.excelProvider.generateBuffer(
      nomeAba,
      colunas,
      linhasParaPlanilha,
      horas
    );

    // 6. Envio do E-mail
    const nomeArquivo = `Relatorio_Horas_${nomeMesSeguro}_${anoAtual}.xlsx`;

    await this.mailProvider.sendMail({
      to: destinatario,
      subject: `Relatório de Horas - ${mesVigente}`,
      body: `<p>Olá, segue em anexo o relatório detalhado de <strong>${mesVigente}</strong>.</p>`,
      attachments: [{
        name: nomeArquivo,
        content: buffer as any,
      }]
    });
  }
}