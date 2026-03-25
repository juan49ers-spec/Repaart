// Instancias cacheadas (Singletons) para evitar Garbage Collection masivo en tablas grandes
const EUR_FORMATTER = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const NUMBER_FORMATTER = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const PERCENT_FORMATTER = new Intl.NumberFormat('es-ES', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
});

/**
 * Formats a number as EUR currency using cached instance.
 * Output: "1.234,56 €"
 */
export const formatCurrency = (amount: number): string => EUR_FORMATTER.format(amount);

/**
 * Formats a number with es-ES locale (dot thousands, comma decimals).
 * Output: "1.234,56" — sin símbolo de moneda.
 */
export const formatNumber = (value: number): string => NUMBER_FORMATTER.format(value);

/**
 * Formatter compatible con Ant Design <Statistic formatter={} />.
 * El componente Statistic pasa el valor como string|number.
 */
export const formatStatistic = (value: string | number | undefined): string =>
    NUMBER_FORMATTER.format(Number(value) || 0);

/**
 * Formats a number as percentage using cached instance.
 * Note: Intl expects 0.1 for 10%, but your data has 20 for 20%.
 * We adapt here dividing by 100 if your data is raw integers.
 */
export const formatPercent = (value: number): string => PERCENT_FORMATTER.format(value / 100);
