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
      body: this.buildReportEmailBody(user.name, mes),
      attachments: [{
        name: `Relatório_horas_${nomeMesSeguro}_${ano}.xlsx`,
        content: buffer as any,
      }]
    });
  }

  private buildReportEmailBody(userName: string, mes: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="500" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #6A11CB 0%, #2575FC 100%); padding: 30px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">Relatório de Horas</h2>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #1e293b; font-size: 16px; margin: 0 0 15px 0;">Olá,</p>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Seguem em anexo os detalhes das atividades e horas trabalhadas referentes ao mês de <strong style="color: #2575FC;">${mes}</strong>.
                    </p>
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="15" style="background-color: #f1f5f9; border-radius: 12px; margin-bottom: 25px;">
                      <tr>
                        <td>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">
                            📌 <strong>Observação:</strong> O arquivo está disponível em formato Excel.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #475569; font-size: 16px; margin: 0;">
                      Qualquer dúvida, estou à disposição.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 30px 40px 30px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #f1f5f9; padding-top: 25px;">
                      <tr>
                        <td>
                          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 5px 0;">Atenciosamente,</p>
                          <strong style="color: #1e293b; font-size: 18px;">${userName}</strong>
                          <p style="color: #2575FC; font-size: 13px; margin: 2px 0 0 0; font-weight: 600;">HourFlow User</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
}
}