import { Schema, model, models } from "mongoose";

const AssetSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    serial: String,
    purchaseDate: Date,
    unitPrice: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    supplier: String,
    status: {
      type: String,
      enum: ["in stock", "issued", "moved outside", "lost", "under repair"],
      default: "in stock",
    },
    location: String,
    imageUrl: String,
  },
  { timestamps: true }
);

export default models.Asset || model("Asset", AssetSchema);
