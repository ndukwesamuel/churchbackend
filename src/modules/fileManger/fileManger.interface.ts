import type { Document, ObjectId } from "mongoose";

export interface IPhoto {
  url: string; // image url or file path
  caption?: string; // optional caption
}

export interface IPhotoFolder {
  name: string; // folder name e.g. Church, Office
  photos: IPhoto[]; // list of photos in this folder
}

export interface IFile extends Document {
  user: ObjectId; // references the Church
  photoFolders: IPhotoFolder[]; // user can have multiple folders
}
