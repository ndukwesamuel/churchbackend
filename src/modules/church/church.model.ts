// import mongoose, { Schema } from "mongoose";
// import type { IChurch } from "./church.interface";

// const ChurchSchema: Schema<IChurch> = new Schema(
//   {
//     churchName: {
//       type: String,
//       trim: true,
//       required: [true, "Please provide a username"],
//     },
//     pastorName: {
//       type: String,
//       trim: true,
//       required: [true, "Please provide a last name"],
//     },
//     email: {
//       type: String,
//       required: [true, "Please provide an email address"],
//       trim: true,
//       lowercase: true,
//       match: [
//         /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
//         "Please provide a valid email address",
//       ],
//       unique: true,
//     },
//     password: {
//       type: String,
//       required: [true, "Please provide a password"],
//       minlength: [8, "Password must be at least 8 characters long"],
//       select: false,
//     },

//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     isVerified: {
//       type: Boolean,
//       default: true,
//     },
//     // roles: {
//     //   type: [String],
//     //   enum: ["user", "driver", "admin"],
//     //   default: ["user"],
//     // },
//   },
//   {
//     timestamps: true,
//   }
// );

// export default mongoose.model<IChurch>("Church", ChurchSchema);

import mongoose, { Schema } from "mongoose";
import type { IChurch } from "./church.interface";

const ChurchSchema: Schema<IChurch> = new Schema(
  {
    churchName: {
      type: String,
      trim: true,
      required: [true, "Please provide a username"],
    },
    pastorName: {
      type: String,
      trim: true,
      required: [true, "Please provide a last name"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email address"],
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
        "Please provide a valid email address",
      ],
      unique: true, // keeps Mongoose happy
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

ChurchSchema.index({ email: 1 }, { unique: true });

export default mongoose.model<IChurch>("Church", ChurchSchema);
