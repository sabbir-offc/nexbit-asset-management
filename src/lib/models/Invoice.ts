import { Schema, Types, model, models } from "mongoose";

const ItemSchema = new Schema({
  assetId: { type: Types.ObjectId, ref: "Asset", required: true },
  name: String,
  quantity: Number,
  unitPrice: Number,
  total: Number,
});

const InvoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, unique: true },
    buyer: String,
    items: [ItemSchema],
    subtotal: Number,
    discount: Number,
    vat: Number,
    grandTotal: Number,
    paidAmount: Number,
    returnedAmount: Number,
    paymentMethod: String,
    notes: String,
  },
  { timestamps: true }
);

export default models.Invoice || model("Invoice", InvoiceSchema);
