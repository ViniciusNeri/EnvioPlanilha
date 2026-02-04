// src/shared/container/providers/MailProvider/models/IMailProvider.ts

export interface IAttachment {
  name: string;
  content: Buffer | string; 
}

export interface ISendMailDTO {
  to: string;
  subject: string;
  body: string;
  attachments?: IAttachment[];
}

export interface IMailProvider {
  sendMail(data: ISendMailDTO): Promise<void>;
}