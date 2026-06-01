/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmtIDR, fmtCompact } from '../utils/helpers';
import { CreditCard, Plus, Calendar, CheckCircle, Clock, Tag, ChevronDown, Sparkles } from 'lucide-react';
import { Installment } from '../types';

interface InstallmentsSectionProps {
  onAddInstallmentClick: () => void;
  onInstallmentClick: (inst: Installment) => void;
}

export const InstallmentsSection: React.FC<InstallmentsSectionProps> = ({
  onAddInstallmentClick,
  onInstallmentClick
}) => {
  const { viewMonth, activeInstallments, totalInstallmentObligation, state } = useBudget();
  const [showCompleted, setShowCompleted] = useState(false);

  const active = activeInstallments(viewMonth);
  const totalObligation = totalInstallmentObligation(viewMonth);

  // Helper inside component to get remaining/paid progress metric
  const _instEndDate = (inst: Installment): string => {
    let [y, mo] = inst.startDate.split('-').map(Number);
    mo += inst.totalMonths - 1;
    while (mo > 12) {
      mo -= 12;
      y++;
    }
    return y + '-' + String(mo).padStart(2, '0');
  };

  const _instRemainingMonths = (inst: Installment, m: string): number => {
    const end = _instEndDate(inst);
    if (m > end) return 0;
    if (m < inst.startDate) return inst.totalMonths;
    const [cy, cm] = m.split('-').map(Number);
    const [ey, em] = end.split('-').map(Number);
    return (ey - cy) * 12 + (em - cm) + 1;
  };

  const _instPaidMonths = (inst: Installment, m: string): number => {
    if (m < inst.startDate) return 0;
    const [sy, smo] = inst.startDate.split('-').map(Number);
    const [cy, cm]  = m.split('-').map(Number);
    const total = (cy - sy) * 12 + (cm - smo);
    return Math.min(total, inst.totalMonths);
  };

  // Group all installments in system
  const allInstallments = state.installments || [];
  
  const categorized = allInstallments.reduce((acc, inst) => {
    const end = _instEndDate(inst);
    const remaining = _instRemainingMonths(inst, viewMonth);
    const paid = _instPaidMonths(inst, viewMonth);
    
    if (viewMonth > end && paid >= inst.totalMonths) {
      acc.completed.push(inst);
    } else if (viewMonth < inst.startDate) {
      acc.upcoming.push(inst);
    } else {
      acc.active.push(inst);
    }
    return acc;
  }, { active: [] as Installment[], completed: [] as Installment[], upcoming: [] as Installment[] });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 pb-8" id="installments-tab-view">
      {/* 1. Header Hero Card */}
      <div className="p-5 bg-white border-b border-gray-150 shadow-sm shrink-0 select-none text-center relative" id="inst-tab-hero">
        <div className="absolute top-4 right-4" id="inst-hero-add-btn-wrapper">
          <button
            onClick={onAddInstallmentClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-200/50 text-amber-800 rounded-md text-[11px] font-bold tracking-wide transition select-none shadow-sm active:scale-95"
            id="inst-register-btn"
          >
            <Plus size={14} className="text-amber-600" />
            <span>Add</span>
          </button>
        </div>

        <div className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-1" id="inst-net-lbl">
          Total Installment Obligation
        </div>
        <div className="text-3xl font-bold tracking-tight text-amber-800 font-mono" id="inst-net-val">
          {fmtIDR(totalObligation)}<span className="text-xs font-semibold text-amber-500 font-sans"> /mo</span>
        </div>
        <div className="text-[11px] text-gray-500 mt-1 flex justify-center items-center gap-2 font-semibold" id="inst-total-subheading">
          <Clock size={12} className="text-gray-400" />
          <span>{active.length} active installments this month</span>
        </div>
      </div>

      {/* 2. List of Installments */}
      <div className="px-4 py-4 space-y-5" id="installments-lists">
        {/* Active Section */}
        <div className="space-y-2" id="inst-active-section">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
            Active Installments ({categorized.active.length})
          </div>
          
          {categorized.active.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-md border border-gray-150 text-xs text-gray-400 flex flex-col items-center justify-center gap-2" id="inst-active-empty">
              <Sparkles className="text-amber-300 w-5 h-5 animate-pulse" />
              <span>No active installments this month</span>
              <button 
                onClick={onAddInstallmentClick}
                className="mt-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-md transition"
              >
                Add Installment
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-150 rounded-md overflow-hidden divide-y divide-gray-100 shadow-sm" id="inst-active-list">
              {categorized.active.map(inst => {
                const remaining = _instRemainingMonths(inst, viewMonth);
                const paid = _instPaidMonths(inst, viewMonth);
                const pct = inst.totalMonths > 0 ? (paid / inst.totalMonths) * 100 : 0;
                const endingSoon = remaining <= 2 && remaining > 0;
                const targetAccount = state.accounts.find(a => a.id === inst.accountId);
                const targetCategory = state.categories.find(c => c.id === inst.catId);

                return (
                  <div
                    key={inst.id}
                    onClick={() => onInstallmentClick(inst)}
                    className="flex items-center gap-3 p-3.5 hover:bg-slate-50/50 cursor-pointer transition select-none"
                    id={`inst-row-${inst.id}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100/50 shrink-0" id={`inst-icon-${inst.id}`}>
                      <CreditCard size={16} />
                    </div>
                    
                    <div className="flex-1 min-w-0" id={`inst-info-${inst.id}`}>
                      <div className="text-xs font-bold text-gray-800 truncate">{inst.name}</div>
                      <div className="text-[10px] text-gray-505 font-semibold text-gray-400 flex items-center gap-1.5 mt-0.5" id={`inst-links-${inst.id}`}>
                        {targetAccount && (
                          <span className="truncate bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                            {targetAccount.name}
                          </span>
                        )}
                        {targetCategory && (
                          <span className="truncate bg-emerald-50 text-emerald-800 border border-emerald-100/40 px-1.5 py-0.5 rounded font-bold">
                            {targetCategory.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0" id={`inst-right-${inst.id}`}>
                      <div className={`text-xs font-bold font-mono ${endingSoon ? 'text-amber-600' : 'text-gray-800'}`}>
                        {fmtIDR(inst.monthlyPayment)}
                      </div>
                      <div className="text-[9px] text-gray-400 font-bold font-mono mt-0.5">
                        PAID: {paid} / {inst.totalMonths} MO
                      </div>
                      {/* Linear beautiful gauge progress bar */}
                      <div className="w-24 h-1 bg-gray-100 rounded-full mt-2 overflow-hidden" id={`inst-progress-${inst.id}`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${endingSoon ? 'bg-amber-400' : 'bg-emerald-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Section */}
        {categorized.upcoming.length > 0 && (
          <div className="space-y-2" id="inst-upcoming-section">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
              Upcoming / Future ({categorized.upcoming.length})
            </div>
            
            <div className="bg-white border border-gray-150 rounded-md overflow-hidden divide-y divide-gray-100/50 shadow-sm" id="inst-upcoming-list">
              {categorized.upcoming.map(inst => {
                const targetAccount = state.accounts.find(a => a.id === inst.accountId);
                const targetCategory = state.categories.find(c => c.id === inst.catId);
                return (
                  <div
                    key={inst.id}
                    onClick={() => onInstallmentClick(inst)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 cursor-pointer transition select-none"
                    id={`inst-uprow-${inst.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                        <Clock size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-700 truncate">{inst.name}</div>
                        <div className="text-[9px] text-blue-600 font-bold uppercase tracking-wider font-mono mt-0.5">
                          Begins {inst.startDate}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs font-bold text-gray-700 font-mono">
                        {fmtIDR(inst.monthlyPayment)}
                      </div>
                      <div className="text-[9px] text-gray-400 font-medium font-mono mt-0.5">
                        Total {inst.totalMonths} mo
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Section Toggle */}
        {categorized.completed.length > 0 && (
          <div className="space-y-2" id="inst-completed-section">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full flex items-center justify-between text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest px-1 py-1 transition select-none"
              id="inst-completed-toggle"
            >
              <span>Paid Off / Completed ({categorized.completed.length})</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showCompleted ? 'rotate-180' : ''}`} />
            </button>

            {showCompleted && (
              <div className="bg-white border border-gray-150 rounded-md overflow-hidden divide-y divide-gray-100/50 shadow-sm" id="inst-completed-list">
                {categorized.completed.map(inst => (
                  <div
                    key={inst.id}
                    onClick={() => onInstallmentClick(inst)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 cursor-pointer transition select-none opacity-60 hover:opacity-100"
                    id={`inst-comprow-${inst.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate line-through">{inst.name}</div>
                        <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider font-mono mt-0.5">
                          Paid Off
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs font-bold text-gray-400 font-mono">
                        {fmtIDR(inst.totalAmount)}
                      </div>
                      <div className="text-[9px] text-gray-400 font-medium font-mono mt-0.5">
                        {inst.totalMonths} mo
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
