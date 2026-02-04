// src/providers/ExcelProvider/ExcelProvider.ts
import ExcelJS from 'exceljs';

export interface IExcelData {
  data: string;
  diaSemana: string;
  horasDia: string | number;
}

export class ExcelProvider {
  async generateBuffer(abaNome: string, colunas: any[], linhas: IExcelData[], total: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(abaNome);

    sheet.columns = colunas;

    // Adiciona as linhas de dados
    linhas.forEach(linha => sheet.addRow(linha));

    // Adiciona linha totalizadora
    sheet.addRow({});
    const totalRow = sheet.addRow({
      diaSemana: 'TOTAL DE HORAS:',
      horasDia: total
    });

    this.applyStyles(sheet, totalRow);

    const buffer = await workbook.xlsx.writeBuffer();

    return (buffer as unknown) as Buffer;
  }

  private applyStyles(sheet: ExcelJS.Worksheet, totalRow: ExcelJS.Row) {
    // Cabeçalho azul
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    // Estilo do Total
    totalRow.font = { bold: true };
    const totalCell = totalRow.getCell(3); // Coluna C (horas)
    totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    totalCell.border = { top: { style: 'double' } };
  }
}