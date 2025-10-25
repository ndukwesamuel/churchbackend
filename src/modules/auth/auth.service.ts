import User from "../user/user.model.js";
import OTP from "../otp/otp.model.js";
import type {
  LoginDTO,
  OTPData,
  RegisterDTO,
  ResetPasswordDTO,
} from "./auth.interface.js";
import UserService from "../user/user.service.js";
import { comparePassword, hashPassword } from "../../utils/validationUtils.js";
import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import { generateToken } from "../../config/token.js";
import logger from "../../utils/logger.js";
import { mailService } from "../../services/mail.service.js";
import userprofileModel from "../churchprofile/churchprofile.model.js";
import churchModel from "../church/church.model.js";
import churchprofileModel from "../churchprofile/churchprofile.model.js";
import { Types } from "mongoose";
export class AuthService {
  static async churchRegister(userData: RegisterDTO) {
    const { password, email, churchName, pastorName } = userData;

    await UserService.checkIfChurchExists(email);

    const hashedPassword = await hashPassword(password);

    const user = new churchModel({
      password: hashedPassword,
      email,
      churchName,
      pastorName,
    });
    const userProfile = new churchprofileModel({ user: user._id });

    await user.save();
    await userProfile.save();

    user.password = undefined;

    // console.log({ user });
    return ApiSuccess.created(
      `Registration Successful, `,
      // OTP has been sent to ${emailInfo.envelope.to}`,
      { user, userProfile }
    );
  }

  static async churchlogin(userData: LoginDTO) {
    const { email, password } = userData;

    const user = await churchModel.findOne({ email }).select("+password");
    await comparePassword(password, user?.password as string);

    // const user = await UserService.findChurchByEmail(email);

    if (!user?.isVerified) {
      throw ApiError.forbidden("Email Not Verified");
    }
    const token = generateToken({ userId: user?._id });

    return ApiSuccess.ok("Login Successful", {
      user: { email: user.email, id: user._id },
      token,
    });
  }

  static async register(userData: RegisterDTO) {
    const { password, email, fullName } = userData;

    await UserService.checkIfUserExists(email);

    console.log({ userData });

    const hashedPassword = await hashPassword(password);

    console.log({ hashedPassword });

    const user = new User({ email, password: hashedPassword, fullName });
    const userProfile = new userprofileModel({ user: user._id });

    let dataa = await user.save();
    await userProfile.save();

    user.password = undefined;

    console.log({ user });
    return ApiSuccess.created(
      `Registration Successful, `,
      // OTP has been sent to ${emailInfo.envelope.to}`,
      { dataa, userProfile }
    );
  }

  static async login(userData: LoginDTO) {
    const { email, password } = userData;
    // const user = await userModel.findOne({ email }).select("+password");
    const user = await UserService.findUserByEmail(email);
    console.log("hello");
    await comparePassword(password, user.password as string);

    if (!user.isVerified) {
      throw ApiError.forbidden("Email Not Verified");
    }
    const token = generateToken({ userId: user._id });

    return ApiSuccess.ok("Login Successful", {
      user: { email: user.email, id: user._id },
      token,
    });
  }

  static async getUser(userId: Types.ObjectId) {
    const user = await UserService.findUserById(userId);
    user.password = undefined;
    return ApiSuccess.ok("User Retrieved Successfully", {
      user,
    });
  }

  static async sendOTP({ email }: { email: string }) {
    const user = await UserService.findUserByEmail(email);
    if (user.isVerified) {
      return ApiSuccess.ok("User Already Verified");
    }

    const emailInfo = await mailService.sendOTPViaEmail(
      user.email,
      ""
      //   user.firstName
    );

    return ApiSuccess.ok(`OTP has been sent to ${emailInfo.envelope.to}`);
  }

  static async verifyOTP({ email, otp }: OTPData) {
    const user = await UserService.findUserByEmail(email);
    if (user.isVerified) {
      return ApiSuccess.ok("User Already Verified");
    }
    const otpExists = await OTP.findOne({ email, otp });
    if (!otpExists) {
      throw ApiError.badRequest("Invalid or Expired OTP");
    }
    user.isVerified = true;
    await user.save();
    return ApiSuccess.ok("Email Verified");
  }

  static async forgotPassword({ email }: { email: string }) {
    const userProfile = await UserService.findUserByEmail(email);
    const emailInfo = await mailService.sendOTPViaEmail(userProfile.email, "");
    return ApiSuccess.ok(`OTP has been sent to ${emailInfo.envelope.to}`);
  }

  static async resetPassword({ email, otp, password }: ResetPasswordDTO) {
    const user = await UserService.findUserByEmail(email);
    const otpExists = await OTP.findOne({ email, otp });
    if (!otpExists) {
      throw ApiError.badRequest("Invalid or Expired OTP");
    }
    user.password = await hashPassword(password);
    await user.save();
    return ApiSuccess.ok("Password Updated");
  }
}

export const authService = new AuthService();
