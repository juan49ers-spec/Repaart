// Instancias cacheadas (Singletons) para evitar Garbage Collection masivo en tablas grandes
const EUR_FORMATTER = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
});

const PERCENT_FORMATTER = new Intl.NumberFormat('es-ES', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
});

/**
 * Formats a number as EUR currency using cached instance.
 */
export const formatCurrency = (amount: number): string => EUR_FORMATTER.format(amount);

/**
 * Formats a number as percentage using cached instance.
 * Note: Intl expects 0.1 for 10%, but your data has 20 for 20%.
 * We adapt here dividing by 100 if your data is raw integers.
 */
export const formatPercent = (value: number): string => PERCENT_FORMATTER.format(value / 100);
