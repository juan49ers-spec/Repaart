import { AdminInvoiceItem } from '../../types/billing';

/**
 * Redondea un número a 2 decimales usando el método bancario estándar.
 */
export const roundToTwoDecimals = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Recalcula una línea individual, asegurando redondeo.
 */
export const calculateLineMetadata = (
  quantity: number,
  unitPrice: number,
  taxRate: number
): { subtotal: number; taxAmount: number; total: number } => {
  const subtotal = roundToTwoDecimals(quantity * unitPrice);
  const taxAmount = roundToTwoDecimals(subtotal * (taxRate / 100));
  const total = roundToTwoDecimals(subtotal + taxAmount);

  return { subtotal, taxAmount, total };
};

/**
 * Función pura para calcular los agregados de una factura iterando línea por línea.
 * Esto asegura que la sumatoria global coincida exactamente con lo visto por el usuario.
 */
export const calculateInvoiceTotals = (
  items: AdminInvoiceItem[]
): { subtotal: number; taxAmount: number; total: number } => {
  return items.reduce(
    (acc, item) => {
      // Recalcular para asegurar inmutabilidad matemática
      const { subtotal, taxAmount, total } = calculateLineMetadata(
        item.quantity,
        item.unitPrice,
        item.taxRate
      );

      return {
        subtotal: roundToTwoDecimals(acc.subtotal + subtotal),
        taxAmount: roundToTwoDecimals(acc.taxAmount + taxAmount),
        total: roundToTwoDecimals(acc.total + total)
      };
    },
    { subtotal: 0, taxAmount: 0, total: 0 }
  );
};
