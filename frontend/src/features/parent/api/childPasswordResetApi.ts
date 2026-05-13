import api from "../../../services/apiClient";

export interface ResetRequest {
  _id: string;
  childId: string;
  childName: string;
  status: "pending" | "otp_sent" | "completed" | "expired";
  expiresAt: string;
  createdAt: string;
}

// Child sends this from login page
export async function requestPasswordHelp(username: string): Promise<{ message: string }> {
  const res = await api.post("/child-password-reset/request", { username });
  return res.data;
}

// Parent fetches pending request for a child
export async function getPendingRequestByChild(
  childId: string,
): Promise<{ request: ResetRequest | null }> {
  const res = await api.get(`/child-password-reset/pending/${childId}`);
  return res.data;
}

// Method 1: parent knows old pattern → change directly
export async function changeChildPassword(
  childId: string,
  oldEmojiPassword: string,
  newEmojiPassword: string,
): Promise<{ message: string }> {
  const res = await api.post(`/child-password-reset/change/${childId}`, {
    oldEmojiPassword,
    newEmojiPassword,
  });
  return res.data;
}

// Method 2a: send OTP to parent email
export async function sendOtp(requestId: string): Promise<{ message: string }> {
  const res = await api.post(`/child-password-reset/${requestId}/send-otp`);
  return res.data;
}

// Method 2b: reset with OTP + new emoji
export async function resetWithOtp(
  requestId: string,
  otp: string,
  newEmojiPassword: string,
): Promise<{ message: string }> {
  const res = await api.post(`/child-password-reset/${requestId}/reset`, {
    otp,
    newEmojiPassword,
  });
  return res.data;
}
