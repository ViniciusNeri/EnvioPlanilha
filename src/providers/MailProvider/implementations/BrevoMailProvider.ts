// src/shared/container/providers/MailProvider/implementations/BrevoMailProvider.ts

import * as Brevo from '@getbrevo/brevo';
import type { IMailProvider, ISendMailDTO } from '../interface/IMailProvider.js';

export class BrevoMailProvider implements IMailProvider {
  private apiInstance: Brevo.TransactionalEmailsApi;

  constructor() {
    this.apiInstance = new Brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY || ''
    );
  }

  async sendMail({ to, copy, subject, body, attachments }: ISendMailDTO): Promise<void> {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.sender = { name: "Vinicius Neri", email: "viniciusneri7@gmail.com" };
    sendSmtpEmail.to = [{ email: to }];
    if (copy) {
      sendSmtpEmail.cc = [{ email: copy }];
    }
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = body;

    if (attachments && attachments.length > 0) {
      sendSmtpEmail.attachment = attachments.map(att => ({
        name: att.name,
        content: Buffer.isBuffer(att.content) 
                 ? att.content.toString('base64') 
                 : att.content
      }));
    }

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.error(error);
      throw new Error("Falha ao enviar e-mail.");  
    }
  }
}