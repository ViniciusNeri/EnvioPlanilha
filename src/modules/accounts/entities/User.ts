import { v4 as uuidV4 } from 'uuid';

export class User {
  id?: string;
  name!: string;
  email!: string;
  password!: string;
  createdAt?: Date;   
  companyName?: string;
  managerEmail?: string;
  receiveCopy?: boolean;

  constructor() {
    if (!this.id) {
      this.id = uuidV4();
    }
  }
}