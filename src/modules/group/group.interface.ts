import type { ObjectId } from "mongoose";
export interface IGroup {
  _id: ObjectId | string;
  name: string;
  description?: string;
}
