export class MessageProvider {
  static async sendSms(contact: any, message: string) {
    console.log(`📩 [SMS] -> ${contact.phoneNumber}: ${message}`);
    return true;
  }

  static async sendWhatsapp(contact: any, message: string) {
    console.log(`💬 [WhatsApp] -> ${contact.phoneNumber}: ${message}`);
    return true;
  }

  static async sendEmail(contact: any, message: string) {
    console.log(`📧 [Email] -> ${contact.email}: ${message}`);
    return true;
  }
}
