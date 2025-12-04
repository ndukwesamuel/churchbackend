import type { Request, Response } from "express";
// import { AuthService } from "./auth.service.js";
import type { AuthenticatedUser } from "../user/user.interface.js";
import ContactsService from "./fileManager.service.js";
import { ApiError } from "../../utils/responseHandler.js";

export class fileMangerController {
  static async GetAllFileManager(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await ContactsService.allCollection(userId);
    res.status(200).json(result);
  }

  static async createFileManager(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await ContactsService.createCollection(userId);
    res.status(200).json(result);
  }

  static async createFolders(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { name } = req.body;
    const result = await ContactsService.createFolder(userId, name);
    res.status(200).json(result);
  }

  static async AddFileToFolders(req: Request, res: Response) {
    try {
      const { userId } = req.user as AuthenticatedUser;
      const { folder_id } = req.body;

      // Validate folder_id
      if (!folder_id) {
        throw ApiError.badRequest("Folder ID is required");
      }

      // Check if files were uploaded
      if (!req.files || !req.files.images) {
        throw ApiError.badRequest("No images uploaded");
      }

      // ✅ Normalize single or multiple files to array
      let imageFiles = req.files.images;
      const imageArray = Array.isArray(imageFiles) ? imageFiles : [imageFiles];

      // ✅ Validate file types (optional but recommended)
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const invalidFiles = imageArray.filter(
        (file) => !allowedTypes.includes(file.mimetype)
      );

      if (invalidFiles.length > 0) {
        throw ApiError.badRequest(
          "Only image files (JPEG, PNG, GIF, WebP) are allowed"
        );
      }

      // ✅ Check file size (optional - e.g., 10MB limit per file)
      const maxSize = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = imageArray.filter((file) => file.size > maxSize);

      if (oversizedFiles.length > 0) {
        throw ApiError.badRequest("File size should not exceed 10MB per image");
      }

      const result = await ContactsService.AddFileTofolder(
        userId,
        folder_id,
        imageArray
      );

      res.status(200).json(result);
    } catch (error) {
      // Handle any errors that weren't caught by the service
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.badRequest("Failed to upload files");
    }
  }

  static async AddFileToFoldersSingle(req: Request, res: Response) {
    try {
      console.log({
        yyyy: "kfkfkfkfk",
      });

      const { userId } = req.user as AuthenticatedUser;
      const { folder_id } = req.body;

      console.log({
        cccc: req.files,
      });

      if (!folder_id) {
        throw ApiError.badRequest("Folder ID is required");
      }

      if (!req.files || !req.files.image) {
        throw ApiError.badRequest("No image uploaded");
      }

      const imageFile = req.files.image;

      // ✅ Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(imageFile.mimetype)) {
        throw ApiError.badRequest(
          "Only image files (JPEG, PNG, GIF, WebP) are allowed"
        );
      }

      // ✅ Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (imageFile.size > maxSize) {
        throw ApiError.badRequest("File size should not exceed 10MB");
      }

      const result = await ContactsService.AddFileTofolderSingle(
        userId,
        folder_id,
        imageFile
      );

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.badRequest("Failed to upload file");
    }
  }
}
