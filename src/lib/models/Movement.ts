import { Schema, Types, model, models } from "mongoose";

const MovementSchema = new Schema(
  {
    // 🔹 Linked asset
    assetId: { type: Types.ObjectId, ref: "Asset", required: true },
    assetName: { type: String, required: true },

    // 🔹 Movement action type
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
    },

    // 🔹 Movement category (for quick filters)
    type: {
      type: String,
      enum: ["sale", "purchase", "adjustment"],
      default: "adjustment",
      index: true,
    },

    // 🔹 Quantity affected
    quantity: { type: Number, required: true, min: 0 },

    // 🔹 Linked invoice (optional)
    referenceInvoice: { type: Types.ObjectId, ref: "Invoice" },
    invoiceNumber: { type: String },

    // 🔹 Related party (buyer or seller name)
    partyName: { type: String, trim: true },

    // 🔹 Optional remarks
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

export default models.Movement || model("Movement", MovementSchema);
