/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Installment } from '../types';

export function getGroupColor(groupId: string): string {
  const colors: Record<string, string> = {
    bills: '#3b82f6',
    food: '#f59e0b',
    fun: '#8b5cf6',
    savings: '#10b981',
    other: '#9ca3af',
  };
  if (colors[groupId]) return colors[groupId];

  let hash = 0;
  for (let i = 0; i < groupId.length; i++) {
    hash = (hash * 31 + groupId.charCodeAt(i)) & 0xffffffff;
  }
  const fallbacks = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
  return fallbacks[Math.abs(hash) % fallbacks.length];
}

export function installmentEndDate(inst: Installment): string {
  let [year, month] = inst.startDate.split('-').map(Number);
  month += inst.totalMonths - 1;
  while (month > 12) {
    month -= 12;
    year++;
  }
  return year + '-' + String(month).padStart(2, '0');
}

export function installmentIsActive(inst: Installment, month: string): boolean {
  const end = installmentEndDate(inst);
  return month >= inst.startDate && month <= end;
}

export function installmentIsCompleted(inst: Installment, month: string): boolean {
  return month > installmentEndDate(inst);
}

export function installmentRemainingMonths(inst: Installment, month: string): number {
  const end = installmentEndDate(inst);
  if (month > end) return 0;
  if (month < inst.startDate) return inst.totalMonths;

  const [currentYear, currentMonth] = month.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);
  return (endYear - currentYear) * 12 + (endMonth - currentMonth) + 1;
}

export function installmentPaidMonths(inst: Installment, month: string): number {
  if (month < inst.startDate) return 0;

  const [startYear, startMonth] = inst.startDate.split('-').map(Number);
  const [currentYear, currentMonth] = month.split('-').map(Number);
  const total = (currentYear - startYear) * 12 + (currentMonth - startMonth);
  return Math.min(total, inst.totalMonths);
}
