import { Request, Response, NextFunction } from "express";
import { sendContactEmail } from "../utils/email.js";
import { BadRequest } from "../utils/AppError.js";

export const submitContactForm = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      throw BadRequest("Name, email, and message are required.");
    }

    await sendContactEmail(name, email, message);

    res.status(200).json({ success: true, message: "Contact message sent successfully" });
  } catch (error) {
    next(error);
  }
};
