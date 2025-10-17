export function calcTotals(
  items: { quantity: number; unitPrice: number }[],
  discount = 0,
  vat = 0,
  paidAmount = 0
) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const vatAmount = (subtotal * vat) / 100;
  const grandTotal = subtotal - discount + vatAmount;
  const returnedAmount = paidAmount - grandTotal;
  return { subtotal, vatAmount, grandTotal, returnedAmount };
}
