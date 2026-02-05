export interface IExcelData {
  data: string;
  diaSemana: string;
  horasDia: string | number;
}

export interface IExtraInfo {
  profissional: string;
  empresa: string;
  mes: string;
}

export interface IExcelProvider {
  generateBuffer(
    abaNome: string,
    colunas: any[],
    linhas: IExcelData[],
    total: number,
    extraInfo: IExtraInfo
  ): Promise<Buffer>;
}