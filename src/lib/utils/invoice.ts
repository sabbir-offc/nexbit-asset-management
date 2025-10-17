import Counter from "@/lib/models/Counter";

export async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const key = `INV-${year}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `${key}-${String(counter.seq).padStart(4, "0")}`;
}
