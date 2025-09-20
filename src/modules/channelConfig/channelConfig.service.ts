import type { ObjectId } from "mongoose";
import type { IChannelConfig } from "./channelConfig.interface";
export class ChannelConfigService {
  static async createChannelConfig(userId: ObjectId, payload: IChannelConfig) {}

  static updateChannelConfig(userId: ObjectId, payload: IChannelConfig) {}
  static getChannelConfig(userId: ObjectId) {}
}
