export function calculateStockAfterReceiving(currentStock: number, receivedQty: number) {
  return currentStock + receivedQty
}

export function validateReceiving(qty: number) {
  return !Number.isFinite(qty) || qty <= 0 ? 'Jumlah harus lebih dari 0.' : ''
}
