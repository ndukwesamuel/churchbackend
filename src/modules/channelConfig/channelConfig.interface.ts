import type { Document } from "mongoose";

export interface IChannelConfig extends Document {
  emailProvider: string;
  fromEmail: string;
  apiKey: string;
  isEnabled: boolean;
}
