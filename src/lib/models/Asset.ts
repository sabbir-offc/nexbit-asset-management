import { Schema, model, models } from "mongoose";

const AssetSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

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
      index: true,
    },

    // Optional serial, but if present it must be unique
    serial: { type: String, trim: true, default: "" },

    purchaseDate: { type: Date, default: null, index: true },

    unitPrice: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, default: 0, min: 0 },

    supplier: { type: String, trim: true, default: "" },

    status: {
      type: String,
      enum: ["in stock", "issued", "moved outside", "lost", "under repair"],
      default: "in stock",
      index: true,
    },

    location: { type: String, trim: true, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

/** ---------------- Indexes ----------------
 * Unique serial ONLY if serial exists and isn't empty.
 * This prevents duplicates while still allowing many empty serials.
 */
AssetSchema.index(
  { serial: 1 },
  {
    unique: true,
    partialFilterExpression: { serial: { $type: "string", $ne: "" } },
  },
);

// Useful default sort and filters
AssetSchema.index({ createdAt: -1 });
AssetSchema.index({ category: 1, status: 1 });

// Optional: speed up simple text-like search
AssetSchema.index({ name: 1 });
AssetSchema.index({ supplier: 1 });
AssetSchema.index({ location: 1 });

export default models.Asset || model("Asset", AssetSchema);
