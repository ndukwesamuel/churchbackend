import type { Request, Response } from "express";
import { TemplateService } from "./template.service";
import type { AuthenticatedUser } from "../user/user.interface";
import type { GetTemplatesQueryDTO } from "./template.schema";
import { ApiError } from "../../utils/responseHandler";
import { TemplateSchemas } from "./template.schema";
export class TemplateController {
  static async createTemplate(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await TemplateService.createTemplate(userId, req.body);
    res.status(result.status_code).json(result);
  }

  static async getAllTemplates(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const parsed = TemplateSchemas.getTemplatesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw ApiError.badRequest("Invalid query parameters");
    }
    const result = await TemplateService.getAllTemplates(userId, parsed.data);
    res.status(result.status_code).json(result);
  }

  static async getTemplateById(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const templateId = req.params.id as string;

    const result = await TemplateService.getTemplateById(userId, templateId);
    res.status(result.status_code).json(result);
  }

  static async updateTemplate(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const templateId = req.params.id as string;
    const result = await TemplateService.updateTemplate(
      userId,
      templateId,
      req.body
    );
    res.status(result.status_code).json(result);
  }

  static async deleteTemplate(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const templateId = req.params.id as string;
    const result = await TemplateService.deleteTemplate(userId, templateId);
    res.status(result.status_code).json(result);
  }

  static async getTemplatesByChannel(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await TemplateService.getTemplatesByChannel(
      userId,
      req.params.channel as "email" | "whatsapp" | "sms"
    );
    res.status(result.status_code).json(result);
  }

  static async searchTemplates(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await TemplateService.searchTemplates(
      userId,
      req.query.q as string
    );
    res.status(result.status_code).json(result);
  }
}
