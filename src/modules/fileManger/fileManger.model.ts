import mongoose, { Schema } from "mongoose";
import type { IFile } from "./fileManger.interface";

const PhotoSchema = new Schema(
  {
    url: {
      type: String,
      required: [true, "Please provide an image URL"],
    },
    publicId: {
      type: String,
      required: [true, "Cloudinary publicId is required"], // 👈 makes deletion easy
    },
    caption: {
      type: String,
      trim: true,
    },
    otherdata: {
      type: Object,
    },
  },
  { timestamps: true }
);

const PhotoFolderSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a folder name"],
      trim: true,
    },
    photos: [PhotoSchema], // 👈 folder contains multiple photos
  },
  { timestamps: true }
);

const FileSchema: Schema<IFile> = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Church",
      required: true,
      index: true,
    },

    // 📂 Each user can have multiple folders
    photoFolders: [PhotoFolderSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IFile>("FileManager", FileSchema);
