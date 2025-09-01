import mongoose, { Schema } from "mongoose";
import type { IUserProfile } from "./churchprofile.interface";

const GroupSchema = new Schema(
  {
    // church: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Church",
    //   required: true,
    // },
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
  },
  { _id: true } // ensures each group has an ObjectId
);

const ChurchProfileSchema: Schema<IUserProfile> = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Church",
      required: true,
      unique: true,
    },

    groups: [GroupSchema],
    // groups: [
    //   {
    //     name: { type: String, trim: true, unique: true },
    //     description: { type: String, trim: true },
    //     // leader: { type: mongoose.Schema.Types.ObjectId, ref: "ChurchMember" },
    //     // members: [
    //     //   { type: mongoose.Schema.Types.ObjectId, ref: "ChurchMember" },
    //     // ],
    //   },
    // ],
    // fullName: {
    //   type: String,
    //   trim: true,
    //   required: [true, "Please provide a username"],
    // },
    // // lastName: {
    // //   type: String,
    // //   trim: true,
    // //   required: [true, "Please provide a last name"],
    // // },
    // email: {
    //   type: String,
    //   required: [true, "Please provide an email address"],
    //   trim: true,
    //   lowercase: true,
    //   match: [
    //     /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
    //     "Please provide a valid email address",
    //   ],
    //   unique: true,
    // },
    // password: {
    //   type: String,
    //   required: [true, "Please provide a password"],
    //   minlength: [8, "Password must be at least 8 characters long"],
    //   select: false,
    // },
    // phoneNumber: {
    //   type: String,
    //   default: "",

    //   trim: true,
    //   // required: [true, "Please provide a phone number"],
    //   match: [
    //     /^(0)(7|8|9){1}(0|1){1}[0-9]{8}$/,
    //     "Please enter a valid Nigerian phone number",
    //   ],
    // },
    // isActive: {
    //   type: Boolean,
    //   default: true,
    // },
    // isVerified: {
    //   type: Boolean,
    //   default: false,
    // },
    // // roles: {
    // //   type: [String],
    // //   enum: ["user", "driver", "admin"],
    // //   default: ["user"],
    // // },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUserProfile>(
  "ChurchProfile",
  ChurchProfileSchema
);
