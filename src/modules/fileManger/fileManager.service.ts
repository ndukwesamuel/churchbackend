import type { ObjectId } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import { hashPassword } from "../../utils/validationUtils";
import type { RegisterDTO } from "../auth/auth.interface";
// import type { IUserProfile } from "./churchprofile.interface";
import churchModel from "../church/church.model";
import churchprofileModel from "./fileManger.model";
import FileManager from "./fileManger.model";
import type { IFile } from "./fileManger.interface";
// import type { IContacts } from "./fileManger.interface";
// import type { IUser } from "./churchprofile.interface";
// import User from "./user.model";
import { v2 as cloudinary } from "cloudinary";

// Configure cloudinary - add this at the beginning of your file
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
    imageData: any
  ) {
    if (!folder_id) {
      throw ApiError.badRequest("Folder ID is required");
    }

    if (!imageData || !imageData.images) {
      throw ApiError.badRequest("No images uploaded");
    }

    const imageFiles = imageData.images;
    const filesArray = Array.isArray(imageFiles) ? imageFiles : [imageFiles];

    const collection = await FileManager.findOne({ user: userId });
    if (!collection) {
      throw ApiError.notFound("User collection not found");
    }

    const folder = collection.photoFolders.id(folder_id);
    if (!folder) {
      throw ApiError.notFound("Folder not found");
    }

    const uploadedImages = await Promise.all(
      imageFiles.map(async (file) => {
        try {
          const upload = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: "user_files",
            resource_type: "auto",
          });

          return {
            url: upload.secure_url, // 👈 match schema
            publicId: upload.public_id, // 👈 store this for easy deletion later
            caption: file.name,
            otherdata: upload,
          };
        } catch (err: any) {
          console.error("Cloudinary upload failed:", err);
          return null;
        }
      })
    );

    // Filter successful uploads
    const successful = uploadedImages.filter((img) => img !== null);

    if (successful.length === 0) {
      throw ApiError.badRequest("All uploads failed");
    }

    // Push into folder
    folder.photos.push(...successful);
    await collection.save();

    return ApiSuccess.ok("Files uploaded successfully", {
      folder,
      uploaded: successful.length,
    });
  }

  // static async createContact(userId: ObjectId, contactData: any) {
  //   const contact = await contactsModel.create({
  //     user: userId,
  //     fullName: contactData.fullName,
  //     email: contactData.email,
  //     phoneNumber: contactData.phoneNumber,
  //     group: contactData.group || "", // optional group
  //   });
  //   return ApiSuccess.ok("User Retrieved Successfully", {
  //     contact,
  //   });
  // }
  // static async createContact(userId: ObjectId, contactData: any) {
  //   const contactPayload: any = {
  //     user: userId,
  //     fullName: contactData.fullName,
  //     email: contactData.email,
  //     phoneNumber: contactData.phoneNumber,
  //   };
  //   if (contactData.groupId) {
  //     contactPayload.group = contactData.groupId; // ✅ only set if valid
  //   }
  //   const contact = await contactsModel.create(contactPayload);
  //   return ApiSuccess.ok("Contact created successfully", { contact });
  // }
  // ✅ Delete all contacts
  // static async deleteAllContacts() {
  //   await contactsModel.deleteMany({});
  //   return ApiSuccess.ok("All contacts deleted successfully", {});
  // }
  // static async createUser(userData: RegisterDTO): Promise<IUser> {
  //   const { password, email, phoneNumber, userName, lastName } = userData;
  //   const hashedPassword = await hashPassword(password);
  //   const user = new User({
  //     userName,
  //     lastName,
  //     phoneNumber,
  //     email,
  //     password: hashedPassword,
  //   });
  //   await user.save();
  //   return user;
  // }
  // static async findUserByEmail(email: string): Promise<IUser> {
  //   const user = await User.findOne({ email });
  //   if (!user) {
  //     throw ApiError.notFound("No user with this email");
  //   }
  //   return user;
  // }
  // static async findUserById(userId: ObjectId): Promise<IUser> {
  //   const user = await User.findById(userId);
  //   if (!user) {
  //     throw ApiError.notFound("User Not Found");
  //   }
  //   return user;
  // }
  // static async isDuplicateGroupName(email: string): Promise<void> {
  //   const user = await User.findOne({ email });
  //   if (user) {
  //     throw ApiError.badRequest("User with this email exists");
  //   }
  // }
  // static isDuplicateGroupName(
  //   groups: { name: string }[],
  //   name: string
  // ): boolean {
  //   if (!groups || !Array.isArray(groups)) return false;
  //   return groups.some(
  //     (g) => g.name.trim().toLowerCase() === name.trim().toLowerCase()
  //   );
  // }
  // static async findUserFile(userId: ObjectId): Promise<IFile> {
  //   const  FileManagerData = await FileManager.findOne({ user: userId }).populate(
  //     "user"
  //   );
  //   // .populate("group");

  //   return FileManagerData;
  // }

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
