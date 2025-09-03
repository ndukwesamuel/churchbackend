import mongoose, { type ObjectId } from "mongoose";
import { ApiSuccess, ApiError } from "../../utils/responseHandler";
import type {
  CreateTemplateDTO,
  UpdateTemplateDTO,
  GetTemplatesQueryDTO,
} from "./template.schema";
import { Template } from "./template.model";
import { paginate } from "../../utils/paginate";
import type { ITemplate } from "./template.interface";
export class TemplateService {
  static async createTemplate(
    userId: ObjectId,
    templateData: CreateTemplateDTO
  ) {
    const { name, channels, content, note, variables } = templateData;

    const template = await Template.create({
      user: userId,
      name,
      channels,
      content,
      note,
      variables: variables.map((variable) => variable) || [],
    });

    return ApiSuccess.created("Template created successfully", template);
  }

  static async getAllTemplates(userId: ObjectId, query: GetTemplatesQueryDTO) {
    const {
      page = 1,
      limit = 10,
      search,
      channel,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const filter: any = { user: userId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
      ];
    }

    if (channel) {
      filter.channels = { $in: [channel] };
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const { documents: templates, pagination } = await paginate<ITemplate>({
      model: Template,
      query: filter,
      page,
      limit,
      sort,
      populateOptions: [
        { path: "user", select: "churchName pastorName email" },
      ],
    });

    return ApiSuccess.ok("Templates retrieved successfully", {
      templates,
      pagination,
    });
  }

  static async getTemplateById(userId: ObjectId, templateId: string) {
    const template = await Template.findOne({
      _id: templateId,
      user: userId,
    }).populate("user", "churchName pastorName email");

    if (!template) {
      throw ApiError.notFound("Template not found");
    }

    return ApiSuccess.ok("Template retrieved successfully", template);
  }

  static async updateTemplate(
    userId: ObjectId,
    templateId: string,
    updateData: UpdateTemplateDTO
  ) {
    const template = await Template.findOneAndUpdate(
      { _id: templateId, user: userId },
      { $set: updateData },
      {
        new: true,
        runValidators: true,
        lean: true,
      }
    );

    if (!template) {
      throw ApiError.notFound("Template not found");
    }

    return ApiSuccess.ok("Template updated successfully", template);
  }

  static async deleteTemplate(
    userId: ObjectId,

    templateId: string,
    session?: mongoose.ClientSession
  ) {
    const template = await Template.findOneAndDelete(
      { _id: templateId, user: userId },
      { session }
    );

    if (!template) {
      throw ApiError.notFound("Template not found");
    }

    return ApiSuccess.ok("Template deleted successfully");
  }

  static async getTemplatesByChannel(
    userId: ObjectId,

    channel: "email" | "whatsapp" | "sms"
  ) {
    const templates = await Template.find({
      user: userId,
      channels: { $in: [channel] },
    })
      .sort({ createdAt: -1 })
      .lean();

    return ApiSuccess.ok(
      `Templates for ${channel} retrieved successfully`,
      templates
    );
  }

  static async searchTemplates(userId: ObjectId, searchTerm: string) {
    const templates = await Template.find({
      user: userId,
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { content: { $regex: searchTerm, $options: "i" } },
        { note: { $regex: searchTerm, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return ApiSuccess.ok("Template search completed", templates);
  }
}
