export interface RegisterDTO {
  fullName: string;
  churchName: string;
  churchType: string;
  pastorName: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  firstName?: string;
  [key: string]: any;
}

export interface OTPData {
  email: string;
  otp: string;
}

export interface ResetPasswordDTO {
  email: string;
  otp: string;
  password: string;
}
