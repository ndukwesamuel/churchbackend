import MessageService from "../messgaing/message.service";

export class MessageProvider {
  static async sendSms(contact: any, message: string) {
    const payload = {
      to: contact.phoneNumber,
      sms: message,
    };
    console.log(`📩 [SMS] -> ${contact.phoneNumber}: ${message}`);
    await MessageService.sendBulkSMSV2(payload);

    return true;
  }

  static async sendWhatsapp(contact: any, message: string) {
    console.log(`💬 [WhatsApp] -> ${contact.phoneNumber}: ${message}`);
    return true;
  }

  static async sendEmail(contact: any, message: string) {
    console.log(`📧 [Email] -> ${contact.email}: ${message}`);
    const payload = {
      to: [contact.email],
      subject: "Notification",
      html: message,
    };
    await MessageService.sendBulkEmail(payload as any);

    return true;
  }
}
