import { Document } from "mongoose";
export interface ICategory extends Document {
  user: object;
  name: string;
  channels: [string];
  category: string;
  content: string;
  note?: string;
  variables?: [object];
  updatedAt: string;
  createdAt: string;
}
