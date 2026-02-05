import ExcelJS from 'exceljs';
import type { IExcelProvider, IExcelData, IExtraInfo } from '../interface/IExcelProvider.js';

export class ExcelProvider implements IExcelProvider {
  async generateBuffer(
    abaNome: string,
    colunas: any[],
    linhas: IExcelData[],
    total: number,
    extraInfo: IExtraInfo
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(abaNome);

    // 1. CONFIGURAÇÃO DE LARGURA DAS COLUNAS
    sheet.columns = [
      { header: 'DATA', key: 'data', width: 15 },
      { header: 'DIA DA SEMANA', key: 'diaSemana', width: 25 },
      { header: 'HORAS', key: 'horasDia', width: 15 },
    ];

    // 2. CABEÇALHO DE IDENTIFICAÇÃO (Linhas 1 a 5)
    sheet.mergeCells('A1:C1');
    const title = sheet.getCell('A1');
    title.value = 'RELATÓRIO MENSAL DE HORAS';
    title.font = { name: 'Arial Black', size: 16, color: { argb: 'FF203764' } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };

    // Informações do Profissional
    this.addHeaderRow(sheet, 3, 'PROFISSIONAL:', extraInfo.profissional);
    this.addHeaderRow(sheet, 4, 'EMPRESA:', extraInfo.empresa);
    this.addHeaderRow(sheet, 5, 'MÊS DE REFERÊNCIA:', extraInfo.mes.toUpperCase());

    // 3. TABELA DE DADOS (Inicia na Linha 7)
    const headerRowIndex = 7;
    const headerRow = sheet.getRow(headerRowIndex);
    headerRow.values = ['DATA', 'DIA DA SEMANA', 'HORAS TRABALHADAS'];
    
    // Aplicar estilo ao cabeçalho da tabela
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203764' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = { bottom: { style: 'thin' }, top: { style: 'thin' } };
    });

    // 4. INSERÇÃO DOS DADOS
    linhas.forEach((linha, index) => {
      const row = sheet.addRow([linha.data, linha.diaSemana, linha.horasDia]);
      row.alignment = { horizontal: 'left' };
      // Zebra nas linhas (opcional, para leitura fácil)
      if (index % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        });
      }
    });

    // 5. LINHA DE TOTAL
    sheet.addRow({}); // Espaço vazio
    const totalRow = sheet.addRow(['', 'TOTAL ACUMULADO:', total]);
    
    // Estilizar Total
    const labelTotal = totalRow.getCell(2);
    const valueTotal = totalRow.getCell(3);

    labelTotal.font = { bold: true };
    labelTotal.alignment = { horizontal: 'right' };

    valueTotal.font = { bold: true };
    valueTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Amarelo
    valueTotal.border = { 
        top: { style: 'thin' }, 
        bottom: { style: 'double' },
        left: { style: 'thin' },
        right: { style: 'thin' }
    };
    valueTotal.alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    return (buffer as unknown) as Buffer;
  }

  // Função auxiliar para criar as linhas do cabeçalho
  private addHeaderRow(sheet: ExcelJS.Worksheet, rowNum: number, label: string, value: string) {
    const row = sheet.getRow(rowNum);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true, color: { argb: 'FF44546A' } };
    row.getCell(2).value = value;
    row.getCell(2).font = { bold: false };
    sheet.mergeCells(`B${rowNum}:C${rowNum}`); // Mescla para o valor ocupar mais espaço
  }
}