import { Schema, Types, model, models } from "mongoose";

const MovementSchema = new Schema(
  {
    assetId: {
      type: Types.ObjectId,
      ref: "Asset",
      required: true,
      index: true,
    },
    assetName: { type: String, required: true, trim: true, index: true },

    action: {
      type: String,
      enum: [
        "added",
        "edited",
        "deleted",
        "sold",
        "purchased",
        "stock_increased",
        "stock_decreased",
        "moved_outside",
        "lost",
        "returned",
        "under_repair",
      ],
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["sale", "purchase", "adjustment"],
      default: "adjustment",
      index: true,
    },

    quantity: { type: Number, required: true, min: 0 },

    referenceInvoice: {
      type: Types.ObjectId,
      ref: "Invoice",
      default: null,
      index: true,
    },
    invoiceNumber: { type: String, trim: true, default: "", index: true },

    partyName: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

// Common list pages: latest logs first
MovementSchema.index({ createdAt: -1 });

// Useful compound index for filtering movements by asset + time
MovementSchema.index({ assetId: 1, createdAt: -1 });

export default models.Movement || model("Movement", MovementSchema);
