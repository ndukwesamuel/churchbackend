import { Document } from "mongoose";
export interface ITemplate extends Document {
  user: object;
  name: string;
  channels: [string];
  category: object;
  content: string;
  note?: string;
  variables?: [object];
  updatedAt: string;
  createdAt: string;
}
