// src/shared/container.ts
import { BrevoMailProvider } from '../providers/MailProvider/implementations/BrevoMailProvider.js';
import { SpreadsheetService } from '../services/SpreadsheetService.js';
import { SpreadsheetController } from '../controllers/SpreadsheetController.js';


const mailProvider = new BrevoMailProvider();
const spreadsheetService = new SpreadsheetService(mailProvider);
const spreadsheetController = new SpreadsheetController(spreadsheetService);

export { spreadsheetController };