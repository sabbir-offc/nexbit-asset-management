import { Schema, model, models } from "mongoose";

const AssetSchema = new Schema(
  {
    name: { type: String, required: true },

    // ✅ Fixed category options
    category: {
      type: String,
      enum: [
        "Electronics",
        "Furniture",
        "Kitchen Accessories",
        "Interior",
        "Others",
      ],
      required: true,
    },

    // Optional unique serial number per asset
    serial: { type: String },

    // ✅ Purchase date field
    purchaseDate: { type: Date },

    // Pricing & stock
    unitPrice: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    supplier: { type: String },

    // ✅ Stock status
    status: {
      type: String,
      enum: ["in stock", "issued", "moved outside", "lost", "under repair"],
      default: "in stock",
    },

    // Optional metadata
    location: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export default models.Asset || model("Asset", AssetSchema);
