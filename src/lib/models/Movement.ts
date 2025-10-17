import { Schema, Types, model, models } from "mongoose";

const MovementSchema = new Schema(
  {
    assetId: { type: Types.ObjectId, ref: "Asset", required: true },
    assetName: String,
    action: String,
    quantity: Number,
    referenceInvoice: { type: Types.ObjectId, ref: "Invoice" },
    remarks: String,
  },
  { timestamps: true }
);

export default models.Movement || model("Movement", MovementSchema);
