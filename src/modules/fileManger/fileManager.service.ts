import type { ObjectId } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import { hashPassword } from "../../utils/validationUtils";
import type { RegisterDTO } from "../auth/auth.interface";
// import type { IUserProfile } from "./churchprofile.interface";
import churchModel from "../church/church.model";
import churchprofileModel from "./fileManger.model";
import FileManager from "./fileManger.model";
import type { IFile } from "./fileManger.interface";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dkzds0azx", // process.env.CLOUDINARY_CLOUD_NAME,
  api_key: "617445194715168", //process.env.CLOUDINARY_API_KEY,
  api_secret: "fMHpeO7b71XuQEDRB9_idWRR3Qk", // process.env.CLOUDINARY_API_SECRET,
});

class FileManagerService {
  static async allCollection(userId: ObjectId) {
    let existing = await FileManager.findOne({ user: userId });

    if (!existing) {
      throw ApiError.notFound("User Dont has a file collection");
    }

    return ApiSuccess.ok("User Retrieved Successfully", {
      existing,
    });
  }

  static async createCollection(userId: ObjectId) {
    let existing = await FileManager.findOne({ user: userId });

    if (existing) {
      throw ApiError.notFound("User already has a file collection");
    }

    const collection = await FileManager.create({
      user: userId,
      photoFolders: [],
    });

    return ApiSuccess.ok("User Retrieved Successfully", {
      collection,
    });
  }

  static async createFolder(userId: ObjectId, name: string) {
    let collection = await FileManagerService.findUserFile(userId);
    if (!collection) {
      throw ApiError.notFound("User collection not found");
    }
    const existingNames = collection.photoFolders.map((f) => f.name);
    const uniqueName = FileManagerService.generateUniqueName(
      name as string,
      existingNames
    );

    collection.photoFolders.push({ name: uniqueName, photos: [] });
    await collection.save();

    return ApiSuccess.ok("User Retrieved Successfully", {
      collection,
    });
  }

  static async AddFileTofolder(
    userId: ObjectId,
    folder_id: string,
    imageFiles: any[]
  ) {
    try {
      // Validate inputs
      if (!folder_id) {
        throw ApiError.badRequest("Folder ID is required");
      }

      if (!imageFiles || imageFiles.length === 0) {
        throw ApiError.badRequest("No images uploaded");
      }

      // Find user's file collection
      const collection = await FileManager.findOne({ user: userId });
      if (!collection) {
        throw ApiError.notFound(
          "User collection not found. Please create a collection first."
        );
      }

      // Find the specific folder
      const folder = collection.photoFolders.id(folder_id);
      if (!folder) {
        throw ApiError.notFound("Folder not found");
      }

      console.log(
        `Uploading ${imageFiles.length} file(s) to folder: ${folder.name}`
      );

      // ✅ Upload all files to Cloudinary
      const uploadPromises = imageFiles.map(async (file, index) => {
        try {
          console.log(`Uploading file ${index + 1}: ${file.name}`);

          const upload = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: `user_files/${userId}/${folder.name}`, // ✅ Organize by user and folder
            resource_type: "auto", // ✅ Handles images, videos, etc.
            public_id: `${Date.now()}_${file.name.split(".")[0]}`, // ✅ Unique filename
            overwrite: false, // ✅ Don't overwrite existing files
          });

          return {
            url: upload.secure_url,
            publicId: upload.public_id,
            caption: file.name, // Original filename as caption
            otherdata: {
              originalName: file.name,
              size: file.size,
              mimetype: file.mimetype,
              uploadedAt: new Date(),
              cloudinaryData: {
                width: upload.width,
                height: upload.height,
                format: upload.format,
                bytes: upload.bytes,
              },
            },
          };
        } catch (err: any) {
          console.error(`Cloudinary upload failed for file ${file.name}:`, err);
          return {
            error: true,
            fileName: file.name,
            message: err.message || "Upload failed",
          };
        }
      });

      const uploadResults = await Promise.all(uploadPromises);

      // ✅ Separate successful uploads from failed ones
      const successfulUploads = uploadResults.filter(
        (result: any) => !result.error
      );
      const failedUploads = uploadResults.filter((result: any) => result.error);

      if (successfulUploads.length === 0) {
        throw ApiError.badRequest("All file uploads failed. Please try again.");
      }

      // ✅ Add successful uploads to the folder
      folder.photos.push(...successfulUploads);
      await collection.save();

      // ✅ Prepare response with detailed info
      const response = {
        folder: {
          id: folder._id,
          name: folder.name,
          totalPhotos: folder.photos.length,
          newlyAdded: successfulUploads.length,
        },
        uploadSummary: {
          total: imageFiles.length,
          successful: successfulUploads.length,
          failed: failedUploads.length,
        },
        newPhotos: successfulUploads.map((photo: any) => ({
          url: photo.url,
          caption: photo.caption,
          publicId: photo.publicId,
        })),
      };

      // ✅ Include failed uploads info if any
      if (failedUploads.length > 0) {
        response.failedUploads = failedUploads.map((failed: any) => ({
          fileName: failed.fileName,
          reason: failed.message,
        }));
      }

      const message =
        failedUploads.length > 0
          ? `${successfulUploads.length} files uploaded successfully, ${failedUploads.length} failed`
          : `All ${successfulUploads.length} files uploaded successfully`;

      return ApiSuccess.ok(message, response);
    } catch (error: any) {
      console.error("AddFileTofolder service error:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.badRequest(`Failed to upload files: ${error.message}`);
    }
  }

  static async AddFileTofolderSingle(
    userId: ObjectId,
    folder_id: string,
    imageFile: any // only one file
  ) {
    try {
      // Validate inputs
      if (!folder_id) {
        throw ApiError.badRequest("Folder ID is required");
      }

      if (!imageFile) {
        throw ApiError.badRequest("No image uploaded");
      }

      // Find user's file collection
      const collection = await FileManager.findOne({ user: userId });
      if (!collection) {
        throw ApiError.notFound(
          "User collection not found. Please create a collection first."
        );
      }

      // Find the specific folder
      const folder = collection.photoFolders.id(folder_id);
      if (!folder) {
        throw ApiError.notFound("Folder not found");
      }

      console.log(
        `Uploading file: ${imageFile.name} to folder: ${folder.name}`
      );

      // ✅ Upload file to Cloudinary
      const upload = await cloudinary.uploader.upload(imageFile.tempFilePath, {
        folder: `user_files/${userId}/${folder.name}`, // ✅ Organize by user and folder
        resource_type: "auto",
        public_id: `${Date.now()}_${imageFile.name.split(".")[0]}`,
        overwrite: false,
      });

      // ✅ Construct uploaded file object
      const uploadedFile = {
        url: upload.secure_url,
        publicId: upload.public_id,
        caption: imageFile.name,
        otherdata: {
          originalName: imageFile.name,
          size: imageFile.size,
          mimetype: imageFile.mimetype,
          uploadedAt: new Date(),
          cloudinaryData: {
            width: upload.width,
            height: upload.height,
            format: upload.format,
            bytes: upload.bytes,
          },
        },
      };

      // ✅ Save to folder
      folder.photos.push(uploadedFile);
      await collection.save();

      const response = {
        folder: {
          id: folder._id,
          name: folder.name,
          totalPhotos: folder.photos.length,
          newlyAdded: 1,
        },
        newPhoto: {
          url: uploadedFile.url,
          caption: uploadedFile.caption,
          publicId: uploadedFile.publicId,
        },
      };

      return ApiSuccess.ok("File uploaded successfully", response);
    } catch (error: any) {
      console.error("AddFileTofolder service error:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.badRequest(`Failed to upload file: ${error.message}`);
    }
  }

  static async findUserFile(userId: ObjectId): Promise<IFile | null> {
    const FileManagerData = await FileManager.findOne({
      user: userId,
    }).populate("user");
    return FileManagerData;
  }
  static generateUniqueName(name: string, existingNames: string[]) {
    let finalName = name;
    let counter = 1;

    // Keep adding suffix until unique
    while (existingNames.includes(finalName)) {
      finalName = `${name}_${counter}`;
      counter++;
    }

    return finalName;
  }
}

export default FileManagerService;
