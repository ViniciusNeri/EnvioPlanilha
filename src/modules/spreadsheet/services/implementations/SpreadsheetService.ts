import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isWeekend, 
  format 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { IMailProvider } from '../../../../providers/MailProvider/interface/IMailProvider.js';
import type { IHolidayRepository } from '../../repositories/interface/IHolidayRepository.js';
import type { ISpreadsheetService, IGenerateAndSendDTO } from '../interface/ISpreadsheetService.js';
import type { IExcelProvider } from '../../../../providers/ExcelProvider/interface/IExcelProvider.js';

export class SpreadsheetService implements ISpreadsheetService {
  // Recebemos as instâncias diretamente no constructor (Injeção manual)
  constructor(
    private mailProvider: IMailProvider,
    private excelProvider: IExcelProvider,
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

    //const feriadosNacionais = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];

    const feriados = await this.holidayRepository.listAll();

    const diasTrabalho = diasDoMes.filter(dia => {
      const eFds = isWeekend(dia);
      const eFer = feriados.includes(format(dia, 'MM-dd'));
      return !eFds && !eFer;
    });

    // 3. Distribuição de Horas
    const horasPorDia = Math.floor(horas / diasTrabalho.length);
    let horasRestantes = horas % diasTrabalho.length;

    // 4. Preparação dos dados
    const linhasParaPlanilha = diasDoMes.map(dia => {
      const dataFormatada = format(dia, 'MM-dd');
      const eFds = isWeekend(dia);
      const eFer = feriados.includes(dataFormatada);
      
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
      horas,{
        profissional: 'Vinicius Neri',
        empresa: 'Cinemark',
        mes: mesVigente
      }
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

    async generateCustomReportAndEmail(dados: {
    nomeProfissional: string;
    nomeEmpresa: string;
    mesVigente: string;
    destinatario: string; // E-mail para onde enviar
    lancamentos: any[];  // O array que vem do Flutter
  }): Promise<Buffer> {
    
    // 1. Calcula o total de horas somando o que veio do Flutter
    const totalHoras = dados.lancamentos.reduce((acc, curr) => acc + Number(curr.horas), 0);

    // 2. Formata os dados para o ExcelProvider
    // Aqui garantimos que o dia da semana esteja traduzido e bonitinho
    const linhasFormatadas = dados.lancamentos.map(l => ({
      data: format(new Date(l.data), 'dd/MM/yyyy'),
      diaSemana: l.diaSemana, // Já vem do Flutter/GetPrepare
      horasDia: l.horas
    }));

    const colunas = [
      { header: 'DATA', key: 'data' },
      { header: 'DIA DA SEMANA', key: 'diaSemana' },
      { header: 'HORAS', key: 'horasDia' }
    ];

    // 3. Chama o ExcelProvider (usando aquela interface bonitona que criamos)
    const buffer = await this.excelProvider.generateBuffer(
      'Relatório de Horas',
      colunas,
      linhasFormatadas,
      totalHoras,
      {
        profissional: dados.nomeProfissional,
        empresa: dados.nomeEmpresa,
        mes: dados.mesVigente
      }
    );

    // 4. Dispara o E-mail com o anexo
    await this.mailProvider.sendMail({
      to: dados.destinatario,
      subject: `Relatório de Horas - ${dados.nomeProfissional} - ${dados.mesVigente}`,
      body: `Olá,\n\nSegue em anexo o relatório de horas referente ao mês de ${dados.mesVigente}.\n\nAtenciosamente,\n${dados.nomeProfissional}`,
      attachments: [
        {
          name: `Relatorio_Horas_${dados.mesVigente}.xlsx`,
          content: buffer
        }
      ]
    });

    return buffer;
  }

    async getFullMonthDays(mesVigente: string, ano: number) {
    const feriados = await this.holidayRepository.listAll();
    
    const mesesMap: Record<string, number> = { 
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 
      'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7, 
      'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11 
    };

    const numeroMes = mesesMap[mesVigente.toLowerCase()];

    if (numeroMes === undefined) {
      throw new Error(`Mês inválido: ${mesVigente}`);
    }

    const dataBase = new Date(ano, numeroMes, 1);
    
    const todosOsDias = eachDayOfInterval({
      start: startOfMonth(dataBase),
      end: endOfMonth(dataBase)
    });

    return todosOsDias.map(dia => {
      const dataFormatada = format(dia, 'yyyy-MM-dd');
      const dataMesDia = format(dia, 'MM-dd');
      const eFds = isWeekend(dia);
      const eFer = feriados.includes(dataMesDia);

      return {
        data: dataFormatada,
        diaSemana: format(dia, 'eeee', { locale: ptBR }),
        tipo: eFer ? 'Feriado' : (eFds ? 'Final de Semana' : 'Útil'),
        sugestaoHoras: (eFer || eFds) ? 0 : 8 // Sugere 0h para folgas e 8h para dias úteis
      };
    });
  }
}