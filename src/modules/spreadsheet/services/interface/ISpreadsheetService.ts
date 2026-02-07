import type { User } from "../../../accounts/entities/User.js";

export interface IGenerateAndSendDTO {
  user : User
  horas: number;
  mesVigente: string;
}

export interface ILancamento {
  data: string;      // Ex: "2026-02-01"
  diaSemana: string; // Ex: "Domingo"
  horas: number;     // Ex: 8
}

export interface IGenerateCustomRequest {
  user : User
  mesVigente: string;
  lancamentos: ILancamento[];
}

export interface ISpreadsheetService {
  generateAndSend(data: IGenerateAndSendDTO): Promise<void>;
  getFullMonthDays(mes: string, ano: number): Promise<any[]>;
  generateCustomReportAndEmail(dados: IGenerateCustomRequest): Promise<Buffer>;
}