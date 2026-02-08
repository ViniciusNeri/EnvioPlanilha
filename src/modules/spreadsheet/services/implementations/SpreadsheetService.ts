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
import type { ISpreadsheetService, IGenerateAndSendDTO, IGenerateCustomRequest } from '../interface/ISpreadsheetService.js';
import type { IExcelProvider } from '../../../../providers/ExcelProvider/interface/IExcelProvider.js';

export class SpreadsheetService implements ISpreadsheetService {
  private readonly mesesMap: Record<string, number> = {
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
    'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  };

  constructor(
    private mailProvider: IMailProvider,
    private excelProvider: IExcelProvider,
    private holidayRepository: IHolidayRepository
  ) {}

  async generateAndSend({ user, horas, mesVigente }: IGenerateAndSendDTO): Promise<void> {
    const anoAtual = new Date().getFullYear();
    const numeroMes = this.getNumeroMes(mesVigente);

    if (!user.managerEmail) {
      throw new Error("E-mail do gestor não encontrado para este usuário.");
    }

    const feriados = await this.holidayRepository.listAll();
    const diasDoMes = this.getDiasDoIntervalo(anoAtual, numeroMes);

    const diasTrabalho = diasDoMes.filter(dia => this.isDiaUtil(dia, feriados));
    
    const horasPorDia = Math.floor(horas / diasTrabalho.length);
    let horasRestantes = horas % diasTrabalho.length;

    const linhasPlanilha = diasDoMes.map(dia => {
      const eFds = isWeekend(dia);
      const eFer = feriados.includes(format(dia, 'MM-dd'));
      let label: string | number = '-';

      if (!eFds && !eFer) {
        label = horasPorDia + (horasRestantes > 0 ? 1 : 0);
        if (horasRestantes > 0) horasRestantes--;
      } else if (eFer) {
        label = 'FERIADO';
      }

      return this.formatarLinha(dia, label);
    });

    const buffer = await this.generateExcel(user, mesVigente, anoAtual, linhasPlanilha, horas);
    await this.sendEmail(user, mesVigente, anoAtual, buffer);
  }

  async generateCustomReportAndEmail({ user, mesVigente, lancamentos }: IGenerateCustomRequest): Promise<void> {
    const totalHoras = lancamentos.reduce((acc, curr) => acc + Number(curr.horas), 0);
    const anoAtual = new Date().getFullYear();
    
    const linhasFormatadas = lancamentos.map(l => ({
      data: format(new Date(l.data), 'dd/MM/yyyy'),
      diaSemana: l.diaSemana, 
      horasDia: l.horas
    }));

    const buffer = await this.generateExcel(user, mesVigente, anoAtual, linhasFormatadas, totalHoras);
    await this.sendEmail(user, mesVigente, anoAtual, buffer);
  }

  async getFullMonthDays(mesVigente: string, ano: number) {
    const feriados = await this.holidayRepository.listAll();
    const dias = this.getDiasDoIntervalo(ano, this.getNumeroMes(mesVigente));

    return dias.map(dia => {
      const eFds = isWeekend(dia);
      const eFer = feriados.includes(format(dia, 'MM-dd'));

      return {
        data: format(dia, 'yyyy-MM-dd'),
        diaSemana: format(dia, 'eeee', { locale: ptBR }),
        tipo: eFer ? 'Feriado' : (eFds ? 'Final de Semana' : 'Útil'),
        sugestaoHoras: (eFer || eFds) ? 0 : 8 
      };
    });
  }

  private getNumeroMes(mes: string): number {
    const numero = this.mesesMap[mes.toLowerCase()];
    if (numero === undefined) throw new Error(`Mês inválido informado: ${mes}`);
    return numero;
  }

  private getDiasDoIntervalo(ano: number, mes: number): Date[] {
    const dataBase = new Date(ano, mes, 1);
    return eachDayOfInterval({
      start: startOfMonth(dataBase),
      end: endOfMonth(dataBase)
    });
  }

  private isDiaUtil(dia: Date, feriados: string[]): boolean {
    return !isWeekend(dia) && !feriados.includes(format(dia, 'MM-dd'));
  }

  private formatarLinha(dia: Date, horas: string | number) {
    return {
      data: format(dia, 'dd/MM/yyyy'),
      diaSemana: format(dia, 'eeee', { locale: ptBR }).toUpperCase(),
      horasDia: horas
    };
  }

  private async generateExcel(user: any, mes: string, ano: number, linhas: any[], totalHoras: number): Promise<Buffer> {

    return this.excelProvider.generateBuffer(
      `Horas - ${mes} ${ano}`,
      linhas,
      totalHoras,
      {
        profissional: user.name,
        empresa: user.companyName!,
        mes: `${mes} - ${ano}`
      }
    );
  }

  private async sendEmail(user: any, mes: string, ano: number, buffer: Buffer): Promise<void> {
    const nomeMesSeguro = mes.replace(/[/\\?*:[\]]/g, '-');
    
    await this.mailProvider.sendMail({
      to: user.managerEmail!,
      copy: user.receiveCopy ? user.email : undefined!,
      subject: `Relatório de Horas - ${user.name} - ${mes}`,
      body: `<p>Olá, segue em anexo o relatório de horas referente ao mês de <strong>${mes}</strong>.</p><p>Atenciosamente,<br>${user.name}</p>`,
      attachments: [{
        name: `Relatório_horas_${nomeMesSeguro}_${ano}.xlsx`,
        content: buffer as any,
      }]
    });
  }
}