export interface IProvider {
  sendSms(contact: any, message: string): Promise<boolean>;
  sendWhatsapp(contact: any, message: string): Promise<boolean>;
  sendEmail(contact: any, message: string): Promise<boolean>;
}

class MessageProvider implements IProvider {
  async sendSms(contact: any, message: string) {
    console.log(`📩 [SMS] -> ${contact.phoneNumber}: ${message}`);
    return true;
  }

  async sendWhatsapp(contact: any, message: string) {
    console.log(`💬 [WhatsApp] -> ${contact.phoneNumber}: ${message}`);
    return true;
  }

  async sendEmail(contact: any, message: string) {
    console.log(`📧 [Email] -> ${contact.email}: ${message}`);
    return true;
  }
}

// export one instance for now
export const messageProvider = new MessageProvider();
