import { Schema, Types, model, models } from "mongoose";

const ItemSchema = new Schema({
  assetId: { type: Types.ObjectId, ref: "Asset", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
});

const InvoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, unique: true, required: true },

    // 🧭 New field: distinguish between sale and purchase
    type: {
      type: String,
      enum: ["sale", "purchase"],
      default: "sale",
      index: true,
    },

    // 🧾 Parties
    buyer: { type: String, trim: true }, // used when we sell
    seller: { type: String, trim: true }, // used when we buy

    // 🧩 Items
    items: { type: [ItemSchema], required: true },

    // 💰 Totals
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    returnedAmount: { type: Number, default: 0 },

    // 💳 Payment Info
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "digital", "credit", "other"],
      default: "cash",
    },
    notes: String,
  },
  { timestamps: true }
);

export default models.Invoice || model("Invoice", InvoiceSchema);
