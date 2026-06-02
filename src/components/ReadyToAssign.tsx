/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmtIDR } from '../utils/helpers';

interface ReadyToAssignProps {
  onAddIncomeClick: () => void;
  onAssignReadyToAssignClick: () => void;
  onSetToast: (msg: string, actionLabel?: string, actionFn?: () => void) => void;
  onShowConfirm: (title: string, msg: string, confirmFn: () => void) => void;
}

export const ReadyToAssign: React.FC<ReadyToAssignProps> = ({
  onAddIncomeClick,
  onAssignReadyToAssignClick,
  onSetToast,
  onShowConfirm
}) => {
  const { 
    viewMonth, getRTA, getAgeOfMoney, autoAssign, resetAssignments, state, totalIncome
  } = useBudget();

  const rta = getRTA(viewMonth);
  const age = getAgeOfMoney();
  const totalInc = totalIncome(viewMonth);

  let bannerClass = "p-4 bg-white border-b border-gray-100 flex flex-col items-stretch gap-3 flex-shrink-0";
  let rtaTextClass = "text-xl sm:text-2xl font-bold tracking-tight font-mono truncate ";
  let labelText = "ready to assign";

  if (rta > 0) {
    rtaTextClass += "text-emerald-600";
    labelText = "Ready to Assign";
  } else if (rta < 0) {
    rtaTextClass += "text-red-600 animate-pulse";
    labelText = "Over-assigned by";
  } else if (totalInc === 0) {
    labelText = "Add accounts to start budgeting";
    rtaTextClass += "text-emerald-700";
  } else {
    rtaTextClass += "text-emerald-800";
    labelText = "All money assigned";
  }

  const handleReset = () => {
    onShowConfirm(
      'Reset Assignments?',
      `Clear assigned amounts for this month? Transactions and accounts will stay unchanged.`,
      () => {
        resetAssignments(viewMonth);
        onSetToast('Assignments reset', null, undefined);
      }
    );
  };

  const handleAutoAssign = () => {
    autoAssign(viewMonth);
    onSetToast('Auto-assigned targets and covered overspending where possible.', null, undefined);
  };

  return (
    <div className={bannerClass} id="rta-banner">
      <div className="flex items-start justify-between gap-2 min-w-0" id="rta-details">
        <div className="min-w-0">
          <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1" id="rta-desc">{labelText}</div>
          <div className={rtaTextClass} id="rta-val">{fmtIDR(Math.abs(rta))}</div>
        </div>
        
        {age !== null && (
          <div className="text-right shrink-0" id="rta-age">
            <div className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mb-1">Age of Money</div>
            <div className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">{age} day{age !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 items-center justify-start" id="rta-actions">
        <button 
          onClick={handleReset}
          className="whitespace-nowrap px-2.5 py-1.5 border border-emerald-650/20 text-emerald-850 hover:bg-emerald-50 rounded text-[10px] font-bold tracking-wide transition select-none"
          id="rta-reset-btn"
        >
          Reset
        </button>
        {state.categories.length > 0 && (
          <button 
            onClick={handleAutoAssign}
            className="whitespace-nowrap px-2.5 py-1.5 border border-emerald-650/20 text-emerald-850 hover:bg-emerald-50 rounded text-[10px] font-bold tracking-wide transition select-none"
            id="rta-auto-btn"
          >
            Auto-Assign
          </button>
        )}
        {rta > 0 && state.categories.length > 0 && (
          <button
            onClick={onAssignReadyToAssignClick}
            className="whitespace-nowrap px-2.5 py-1.5 border border-emerald-650/20 text-emerald-850 hover:bg-emerald-50 rounded text-[10px] font-bold tracking-wide transition select-none"
            id="rta-assign-btn"
          >
            Assign Leftover
          </button>
        )}
        <button 
          onClick={onAddIncomeClick}
          className="whitespace-nowrap px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white rounded text-[10px] font-bold tracking-wide shadow-sm transition select-none"
          id="rta-income-btn"
        >
          + Income
        </button>
      </div>
    </div>
  );
};
