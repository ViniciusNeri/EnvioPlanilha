// src/shared/container.ts
import { BrevoMailProvider } from '../../providers/MailProvider/implementations/BrevoMailProvider.js';
import { HybridHolidayRepository } from '../../modules/spreadsheet/repositories/implementations/HybridHolidayRepository.js';
import { SpreadsheetService } from '../../modules/spreadsheet/services/implementations/SpreadsheetService.js';
import { SpreadsheetController } from '../../modules/spreadsheet/controllers/SpreadsheetController.js';
import { ExcelProvider } from '../../providers/ExcelProvider/implementations/ExcelProvider.js';
import { MongoUserRepository } from '../../modules/accounts/repositories/implementations/MongoUserRepository.js';
import { UserService } from '../../modules/accounts/services/implementations/UserService.js';
import { UserController } from '../../modules/accounts/controllers/UserController.js';
import { AuthenticateController } from '../../modules/accounts/controllers/AuthenticateController.js';
import { AuthenticateUserService } from '../../modules/accounts/services/implementations/AuthenticateUserService.js';


const mailProvider = new BrevoMailProvider();
const excelProvider = new ExcelProvider();
const hybridHolidayRepository = new HybridHolidayRepository();
const spreadsheetService = new SpreadsheetService(mailProvider, excelProvider, hybridHolidayRepository);
const spreadsheetController = new SpreadsheetController(spreadsheetService);


const userRepository = new MongoUserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);
const authenticateUserService = new AuthenticateUserService(userRepository);
const authenticateController = new AuthenticateController(authenticateUserService);

export { spreadsheetController , userController, authenticateController };