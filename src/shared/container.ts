// src/shared/container.ts
import { BrevoMailProvider } from '../providers/MailProvider/implementations/BrevoMailProvider.js';
import { MongoHolidayRepository } from '../repositories/implementations/MongoHolidayRepository.js';
import { SpreadsheetService } from '../services/SpreadsheetService.js';
import { SpreadsheetController } from '../controllers/SpreadsheetController.js';
import { ExcelProvider } from '../providers/ExcelProvider/ExcelProvider.js';


const mailProvider = new BrevoMailProvider();
const excelProvider = new ExcelProvider();
const mongoHolidayRepository = new MongoHolidayRepository();
const spreadsheetService = new SpreadsheetService(mailProvider, excelProvider, mongoHolidayRepository);
const spreadsheetController = new SpreadsheetController(spreadsheetService);

export { spreadsheetController };