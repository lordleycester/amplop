/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmtIDR, todayMonth, todayStr } from '../utils/helpers';
import { Calendar, Check, Clock, PlaySquare, Trash2 } from 'lucide-react';
import type { Recurring } from '../types';

interface RecurringBannerProps {
  onAddExpenseClick: () => void;
  onSetToast: (msg: string, actionLabel?: string, actionFn?: () => void) => void;
  onShowConfirm: (title: string, msg: string, confirmFn: () => void) => void;
}

const dismissKeyForMonth = (month: string) => `amplop_recurring_banner_dismissed_${month}`;

export const RecurringBanner: React.FC<RecurringBannerProps> = ({
  onAddExpenseClick,
  onSetToast,
  onShowConfirm
}) => {
  const { state, viewMonth, getPendingRecurring, approveRecurring, approveAllPendingRecurring, deleteRecurring } = useBudget();
  const [dismissedByMonth, setDismissedByMonth] = useState<Record<string, boolean>>({});
  const isDismissed = dismissedByMonth[viewMonth] ?? (() => {
    try {
      return localStorage.getItem(dismissKeyForMonth(viewMonth)) === 'true';
    } catch {
      return false;
    }
  })();

  const pending = getPendingRecurring(viewMonth);
  const pendingIds = new Set(pending.map(rec => rec.id));

  const ordinal = (d: number) => {
    if (d === 1) return '1st';
    if (d === 2) return '2nd';
    if (d === 3) return '3rd';
    return d + 'th';
  };

  const recDateForMonth = (rec: Recurring, month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const day = Math.min(rec.dayOfMonth || 1, 28);
    return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const recInRange = (rec: Recurring, month: string) => {
    if (month < rec.startDate.substring(0, 7)) return false;
    if (rec.endDate && month > rec.endDate.substring(0, 7)) return false;
    return true;
  };

  const recEnteredForMonth = (rec: Recurring, month: string) => {
    if (rec.type === 'income') {
      return state.income.some(income => income.recurringId === rec.id && income.date.substring(0, 7) === month);
    }
    return state.transactions.some(tx => tx.recurringId === rec.id && tx.date.substring(0, 7) === month);
  };

  const visibleRecurring = state.recurring
    .filter(rec => rec.active && recInRange(rec, viewMonth))
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.name.localeCompare(b.name));

  if (isDismissed || visibleRecurring.length === 0) return null;

  const dismissForMonth = () => {
    try {
      localStorage.setItem(dismissKeyForMonth(viewMonth), 'true');
    } catch {}
    setDismissedByMonth(prev => ({ ...prev, [viewMonth]: true }));
  };

  const handleApproveAll = () => {
    approveAllPendingRecurring(viewMonth);
    onSetToast(`${pending.length} scheduled transactions entered`, null, undefined);
  };

  const handleApproveOne = (id: string, name: string) => {
    approveRecurring(id, viewMonth);
    onSetToast(`Approved recurring: ${name}`, null, undefined);
  };

  const handleDelete = (rec: Recurring) => {
    onShowConfirm(
      `Remove "${rec.name}"?`,
      'This removes the monthly schedule. Transactions already entered will stay.',
      () => {
        deleteRecurring(rec.id);
        onSetToast(`Removed monthly schedule: ${rec.name}`, null, undefined);
      }
    );
  };

  return (
    <div className="bg-emerald-50 border-b-2 border-emerald-850 p-4 shrink-0 transition" id="rec-banner-card">
      <div className="flex items-center justify-between gap-4 mb-3" id="rec-banner-header">
        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5" id="rec-banner-title">
          <Calendar size={14} />
          Monthly transactions
        </span>
        <div className="flex gap-2" id="rec-banner-controls">
          {pending.length > 0 && (
            <button
              onClick={handleApproveAll}
              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded select-none transition"
              id="rec-banner-enter-all-btn"
            >
              Enter Due
            </button>
          )}
          <button
            onClick={dismissForMonth}
            className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 bg-gray-200 border border-gray-300 rounded transition"
            id="rec-banner-dismiss-btn"
          >
            Dismiss
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[140px] overflow-y-auto" id="rec-banner-items">
        {visibleRecurring.map(rec => {
          const isIncome = rec.type === 'income';
          const entered = recEnteredForMonth(rec, viewMonth);
          const isPending = pendingIds.has(rec.id);
          const dueDate = recDateForMonth(rec, viewMonth);
          const isFutureDue = viewMonth === todayMonth() && dueDate > todayStr();
          const status = entered ? 'Entered' : isPending ? 'Ready to enter' : isFutureDue ? 'Scheduled' : 'Not entered';

          return (
            <div
              key={rec.id}
              className="group flex items-center justify-between p-2 rounded hover:bg-emerald-100/50 transition border border-transparent hover:border-emerald-200"
              id={`rec-item-${rec.id}`}
            >
              <div className="flex items-center gap-2 min-w-0" id={`rec-item-info-${rec.id}`}>
                <div className={`p-1 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                  {entered ? <Check size={13} /> : isPending ? <PlaySquare size={13} /> : <Clock size={13} />}
                </div>
                <div className="min-w-0" id={`rec-item-text-${rec.id}`}>
                  <div className="text-xs font-semibold text-gray-800 truncate">{rec.name}</div>
                  <div className="text-[10px] text-gray-500">
                    {ordinal(rec.dayOfMonth)} of the month · {status}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0" id={`rec-item-right-${rec.id}`}>
                <div className={`text-xs font-mono font-bold ${isIncome ? 'text-emerald-700' : 'text-red-700'}`}>
                  {isIncome ? '+' : '−'}{fmtIDR(rec.amount)}
                </div>
                {isPending && (
                  <button
                    onClick={() => handleApproveOne(rec.id, rec.name)}
                    className="px-2 py-1 text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 hover:border-emerald-700 transition"
                    id={`rec-enter-${rec.id}`}
                  >
                    Enter
                  </button>
                )}
                <button
                  onClick={() => handleDelete(rec)}
                  className="w-6 h-6 border border-gray-200 flex items-center justify-center text-gray-400 bg-white hover:text-red-600 hover:border-red-200 transition"
                  id={`rec-delete-${rec.id}`}
                  title="Remove monthly schedule"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-gray-400 flex items-center justify-between mt-3" id="rec-banner-footer">
        <span>{pending.length > 0 ? `${pending.length} ready for ${viewMonth}` : `No due items for ${viewMonth}`}</span>
        <button
          onClick={onAddExpenseClick}
          className="text-emerald-800 hover:underline font-semibold"
          id="rec-banner-add-new-btn"
        >
          + Add Monthly Expense
        </button>
      </div>
    </div>
  );
};
