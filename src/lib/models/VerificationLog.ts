import { Schema, model, models } from "mongoose";

const VerificationLogSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    verifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.VerificationLog ||
  model("VerificationLog", VerificationLogSchema);
