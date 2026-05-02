// This replaces the real email utility during all tests
export const generateOtp = () => "123456";
export const hashOtp = async (otp: string) => otp;
export const compareOtp = async (a: string, b: string) => a === b;
export const sendVerificationEmail = async () => undefined;
export const sendResetEmail = async () => undefined;