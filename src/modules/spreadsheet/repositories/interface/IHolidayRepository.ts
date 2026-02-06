// src/repositories/interface/IHolidayRepository.ts
export interface IHolidayRepository {
  listAll(): Promise<string[]>;
}