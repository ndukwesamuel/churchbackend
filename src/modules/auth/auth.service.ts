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
import type { ObjectId } from "mongoose";
import userModel from "../user/user.model.js";
import churchModel from "../church/church.model.js";
import { ChurchService } from "../church/church.service.js";
export class AuthService {
  static async churchRegister(userData: RegisterDTO) {
    const { fullName, churchType, password, email, churchName, pastorName } =
      userData;
    const firstName = fullName.split(" ")[0];
    await ChurchService.checkIfChurchExists(email);
    console.log({ userData });
    const hashedPassword = await hashPassword(password);

    const user = new churchModel({
      password: hashedPassword,
      churchType,
      fullName,
      email,
      churchName,
      pastorName,
    });

    // const emailInfo = await mailService.sendOTPViaEmail(user.email, firstName!);
    // console.log({ emailInfo });
    await user.save();

    user.password = undefined;

    // console.log({ user });
    return ApiSuccess.created(
      `Registration Successful`
      // `OTP has been sent to ${emailInfo.envelope.to}`
    );
  }

  static async churchlogin(userData: LoginDTO) {
    const { email, password } = userData;

    const user = await ChurchService.findChurchByEmail(email);

    await comparePassword(password, user.password as string);

    // if (!user.isVerified) {
    //   throw ApiError.forbidden("Email Not Verified");
    // }
    const token = generateToken({ userId: user._id });
    const userDetails = {
      id: user._id,

      churchType: user.churchType,
      churchName: user.churchName,
      pastorName: user.pastorName,
      fullName: user.fullName,
      email: user.email,
    };
    return ApiSuccess.ok("Login Successful", {
      user: userDetails,
      token,
    });
  }

  static async getUser(userId: ObjectId) {
    const user = await ChurchService.findChurchById(userId);
    user.password = undefined;
    return ApiSuccess.ok("User Retrieved Successfully", {
      user,
    });
  }

  static async sendOTP({ email }: { email: string }) {
    const user = await ChurchService.findChurchByEmail(email);
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
    const user = await ChurchService.findChurchByEmail(email);
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
    const userProfile = await ChurchService.findChurchByEmail(email);
    const emailInfo = await mailService.sendOTPViaEmail(userProfile.email, "");
    return ApiSuccess.ok(`OTP has been sent to ${emailInfo.envelope.to}`);
  }

  static async resetPassword({ email, otp, password }: ResetPasswordDTO) {
    const user = await ChurchService.findChurchByEmail(email);
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
