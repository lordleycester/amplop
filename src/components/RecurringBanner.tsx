/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmtIDR } from '../utils/helpers';
import { Calendar, Check, PlaySquare } from 'lucide-react';

interface RecurringBannerProps {
  onAddRecurringClick: () => void;
  onSetToast: (msg: string, actionLabel?: string, actionFn?: () => void) => void;
}

export const RecurringBanner: React.FC<RecurringBannerProps> = ({
  onAddRecurringClick,
  onSetToast
}) => {
  const { viewMonth, getPendingRecurring, approveRecurring, approveAllPendingRecurring } = useBudget();
  const [isDismissed, setIsDismissed] = useState(false);

  const pending = getPendingRecurring(viewMonth);
  if (isDismissed || pending.length === 0) return null;

  const handleApproveAll = () => {
    approveAllPendingRecurring(viewMonth);
    onSetToast(`${pending.length} scheduled transactions entered`, null, undefined);
  };

  const handleApproveOne = (id: string, name: string) => {
    approveRecurring(id, viewMonth);
    onSetToast(`Approved recurring: ${name}`, null, undefined);
  };

  return (
    <div className="bg-emerald-50 border-b-2 border-emerald-850 p-4 shrink-0 transition" id="rec-banner-card">
      <div className="flex items-center justify-between gap-4 mb-3" id="rec-banner-header">
        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5" id="rec-banner-title">
          <Calendar size={14} />
          {pending.length} scheduled transaction{pending.length > 1 ? 's' : ''} due
        </span>
        <div className="flex gap-2" id="rec-banner-controls">
          <button
            onClick={handleApproveAll}
            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded select-none transition"
            id="rec-banner-enter-all-btn"
          >
            Enter All
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 bg-gray-200 border border-gray-300 rounded transition"
            id="rec-banner-dismiss-btn"
          >
            Dismiss
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[140px] overflow-y-auto" id="rec-banner-items">
        {pending.map(rec => {
          const ordinal = (d: number) => {
            if (d === 1) return '1st';
            if (d === 2) return '2nd';
            if (d === 3) return '3rd';
            return d + 'th';
          };
          const isIncome = rec.type === 'income';

          return (
            <div
              key={rec.id}
              onClick={() => handleApproveOne(rec.id, rec.name)}
              className="group flex items-center justify-between p-2 rounded hover:bg-emerald-100/50 cursor-pointer transition border border-transparent hover:border-emerald-200"
              id={`rec-item-${rec.id}`}
            >
              <div className="flex items-center gap-2 min-w-0" id={`rec-item-info-${rec.id}`}>
                <div className={`p-1 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                  <PlaySquare size={13} />
                </div>
                <div className="min-w-0" id={`rec-item-text-${rec.id}`}>
                  <div className="text-xs font-semibold text-gray-800 truncate">{rec.name}</div>
                  <div className="text-[10px] text-gray-500">{ordinal(rec.dayOfMonth)} of the month</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0" id={`rec-item-right-${rec.id}`}>
                <div className={`text-xs font-mono font-bold ${isIncome ? 'text-emerald-700' : 'text-red-700'}`}>
                  {isIncome ? '+' : '−'}{fmtIDR(rec.amount)}
                </div>
                <div className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-emerald-700 bg-white group-hover:border-emerald-600 transition" id={`rec-item-indicator-${rec.id}`}>
                  <Check size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-gray-400 flex items-center justify-between mt-3" id="rec-banner-footer">
        <span>Tap item to enter individually</span>
        <button
          onClick={onAddRecurringClick}
          className="text-emerald-800 hover:underline font-semibold"
          id="rec-banner-add-new-btn"
        >
          + Add Recurring
        </button>
      </div>
    </div>
  );
};
