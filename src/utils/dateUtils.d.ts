// Type declarations for date utilities

export function formatWeekRange(date: Date): string;
export function getWeekStart(date: Date): Date;
export function getWeekEnd(date: Date): Date;
export function addDays(date: Date, days: number): Date;
export function isSameDay(date1: Date, date2: Date): boolean;
export function toLocalDateString(date: Date | string, options?: any): string;
