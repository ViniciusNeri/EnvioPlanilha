// src/repositories/implementations/MongoHolidayRepository.ts
import type { IHolidayRepository } from '../interface/IHolidayRepository.js';
import { HolidayModel } from '../../infra/database/mongoose/schemas/Holiday.js';

export class MongoHolidayRepository implements IHolidayRepository {
  async listAll(): Promise<string[]> {
    const holidays = await HolidayModel.find().lean();
    return holidays.map(h => h.date);
  }
}