/**
 * Utility functions for money/currency handling
 */

export const formatMoney = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPrice = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

export const parseMoney = (value: string): number => {
  return parseFloat(value.replace(/[^\d.-]/g, ''));
};

export const isValidAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount >= 0;
};
