/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, PiggyBank, X } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { fmtIDR, todayMonth } from '../utils/helpers';

interface MonthEndNudgeProps {
  onAssignNow: () => void;
}

const dismissKeyForMonth = (month: string) => `amplop_month_end_nudge_dismissed_${month}`;

const daysLeftInMonth = () => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return end.getDate() - now.getDate();
};

export const MonthEndNudge: React.FC<MonthEndNudgeProps> = ({ onAssignNow }) => {
  const { viewMonth, getRTA, totalIncome } = useBudget();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKeyForMonth(todayMonth())) === 'true';
    } catch {
      return false;
    }
  });

  const shouldShow = useMemo(() => {
    return (
      viewMonth === todayMonth() &&
      daysLeftInMonth() <= 5 &&
      getRTA(viewMonth) > 0 &&
      totalIncome(viewMonth) > 0 &&
      !dismissed
    );
  }, [dismissed, getRTA, totalIncome, viewMonth]);

  if (!shouldShow) return null;

  const rta = getRTA(viewMonth);

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKeyForMonth(viewMonth), 'true');
    } catch {}
    setDismissed(true);
  };

  return (
    <div className="bg-white border-b-[3px] border-gray-900 p-3 select-none" id="month-end-nudge">
      <div className="border-2 border-gray-900 bg-amber-50 shadow-[3px_3px_0_#1E1E1E]">
        <div className="flex items-start gap-3 p-3">
          <div className="w-9 h-9 shrink-0 bg-amber-500 text-white border-2 border-gray-900 flex items-center justify-center">
            <PiggyBank size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.18em]">Month-end check</div>
            <h3 className="text-sm font-bold text-gray-900 mt-0.5">{fmtIDR(rta)} is still waiting for a job</h3>
            <p className="text-xs leading-relaxed text-gray-600 mt-1">
              You can assign it now, move it to a savings goal, or leave it for later.
            </p>
          </div>

          <button
            onClick={dismiss}
            className="p-1 text-gray-400 hover:text-gray-900 transition"
            id="month-end-nudge-dismiss"
            aria-label="Dismiss month-end nudge"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_1fr] gap-2 border-t-2 border-gray-900 p-3">
          <button
            onClick={onAssignNow}
            className="py-2 px-3 bg-emerald-800 text-white text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5"
            id="month-end-nudge-assign"
          >
            <ArrowRight size={13} />
            Assign Now
          </button>
          <button
            onClick={dismiss}
            className="py-2 px-3 bg-white text-gray-900 border-2 border-gray-900 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5"
            id="month-end-nudge-later"
          >
            <CheckCircle2 size={13} />
            Leave For Now
          </button>
        </div>
      </div>
    </div>
  );
};
