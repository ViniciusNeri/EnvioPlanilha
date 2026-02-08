import ExcelJS from 'exceljs';
import type { IExcelProvider, IExcelData, IExtraInfo } from '../interface/IExcelProvider.js';

// Centralização de constantes de estilo para fácil manutenção
const STYLES = {
  COLORS: {
    PRIMARY: 'FF203764',   // Azul Escuro
    SECONDARY: 'FF44546A', // Azul Acinzentado
    WHITE: 'FFFFFFFF',
    ZEBRA: 'FFF2F2F2',    // Cinza claro
    TOTAL_BG: 'FFFFFF00', // Amarelo
  },
  FONTS: {
    TITLE: { name: 'Arial Black', size: 16 },
    HEADER: { bold: true, size: 11 },
    BODY: { name: 'Arial', size: 10 }
  }
};

export class ExcelProvider implements IExcelProvider {
  async generateBuffer(
    abaNome: string,
    linhas: IExcelData[],
    total: number,
    extraInfo: IExtraInfo
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(abaNome);

    this.setupColumns(sheet);
    this.renderHeader(sheet, extraInfo);
    this.renderDataTable(sheet, linhas);
    this.renderFooter(sheet, total);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Define as colunas e larguras iniciais
   */
  private setupColumns(sheet: ExcelJS.Worksheet): void {
    sheet.columns = [
      { key: 'data', width: 18 },
      { key: 'diaSemana', width: 25 },
      { key: 'horasDia', width: 18 },
    ];
  }

  /**
   * Renderiza o título e as informações do profissional (Linhas 1-5)
   */
  private renderHeader(sheet: ExcelJS.Worksheet, info: IExtraInfo): void {
    // Título Principal
    sheet.mergeCells('A1:C1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'RELATÓRIO MENSAL DE HORAS';
    titleCell.font = { ...STYLES.FONTS.TITLE, color: { argb: STYLES.COLORS.PRIMARY } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Linhas de Informação
    this.addHeaderRow(sheet, 3, 'PROFISSIONAL:', info.profissional);
    this.addHeaderRow(sheet, 4, 'EMPRESA:', info.empresa);
    this.addHeaderRow(sheet, 5, 'MÊS DE REFERÊNCIA:', info.mes.toUpperCase());
  }

  /**
   * Renderiza a tabela de dados com estilo Zebra e Cabeçalho
   */
  private renderDataTable(sheet: ExcelJS.Worksheet, linhas: IExcelData[]): void {
    const START_ROW = 7;
    
    // Configuração do Cabeçalho da Tabela
    const headerRow = sheet.getRow(START_ROW);
    headerRow.values = ['DATA', 'DIA DA SEMANA', 'HORAS TRABALHADAS'];
    
    headerRow.eachCell((cell) => {
      cell.font = { ...STYLES.FONTS.HEADER, color: { argb: STYLES.COLORS.WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLES.COLORS.PRIMARY } };
      cell.alignment = { horizontal: 'center' };
      this.applyFullBorder(cell);
    });

    // Inserção dos dados
    linhas.forEach((linha, index) => {
      const currentRow = sheet.addRow([linha.data, linha.diaSemana, linha.horasDia]);
      const isZebra = index % 2 === 0;

      currentRow.eachCell((cell) => {
        cell.font = STYLES.FONTS.BODY;
        cell.alignment = { horizontal: 'center' };
        this.applyFullBorder(cell);
        
        if (isZebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLES.COLORS.ZEBRA } };
        }
      });
    });
  }

  /**
   * Renderiza a linha de total acumulado
   */
  private renderFooter(sheet: ExcelJS.Worksheet, total: number): void {
    sheet.addRow([]); // Linha vazia de respiro

    const totalRow = sheet.addRow(['', 'TOTAL ACUMULADO:', total]);
    
    const labelTotal = totalRow.getCell(2);
    const valueTotal = totalRow.getCell(3);

    labelTotal.font = { bold: true };
    labelTotal.alignment = { horizontal: 'right' };

    valueTotal.font = { bold: true };
    valueTotal.alignment = { horizontal: 'center' };
    valueTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLES.COLORS.TOTAL_BG } };
    
    valueTotal.border = { 
      top: { style: 'thin' }, 
      bottom: { style: 'double' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  }

  /**
   * Helper: Adiciona linha de informação formatada
   */
  private addHeaderRow(sheet: ExcelJS.Worksheet, rowNum: number, label: string, value: string): void {
    const row = sheet.getRow(rowNum);
    const labelCell = row.getCell(1);
    const valueCell = row.getCell(2);

    labelCell.value = label;
    labelCell.font = { bold: true, color: { argb: STYLES.COLORS.SECONDARY } };
    
    valueCell.value = value;
    sheet.mergeCells(`B${rowNum}:C${rowNum}`);
    valueCell.alignment = { horizontal: 'left' };
  }

  /**
   * Helper: Aplica borda fina em todos os lados
   */
  private applyFullBorder(cell: ExcelJS.Cell): void {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
}