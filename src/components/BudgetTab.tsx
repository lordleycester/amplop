/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmtIDR, fmtCompact, monthLabel, monthLabelShort } from '../utils/helpers';
import { getGroupColor } from '../utils/sharedUtils';
import { ChevronDown, Plus, Target as TargetIcon, Layers, TrendingUp, Sparkles, CheckCircle2, PieChart, Activity, ShoppingBag } from 'lucide-react';
import { Category, Group } from '../types';

interface BudgetTabProps {
  onAddCategoryClick: (groupId: string) => void;
  onCategoryClick: (cat: Category) => void;
  onMoveMoneyClick: (cat: Category) => void;
  onSetTargetClick: (cat: Category) => void;
  onActivityClick: (cat: Category) => void;
  onSetToast: (msg: string, actionLabel?: string | null, actionFn?: () => void) => void;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({
  onAddCategoryClick,
  onCategoryClick,
  onMoveMoneyClick,
  onSetTargetClick,
  onActivityClick,
  onSetToast
}) => {
  const {
    state,
    viewMonth,
    toggleGroupCollapsed,
    getAssigned,
    getSpent,
    getAvailable,
    setAssigned,
    copyBudgets,
    totalIncome
  } = useBudget();

  // Sub-view toggle state: Envelope Budget or Spending Analysis
  const [budgetSubView, setBudgetSubView] = useState<'envelopes' | 'analysis'>('envelopes');

  // Inline assigned editing state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Find most recent previous budgeted month
  const budgetsList = useMemo(
    () => Object.keys(state.budgets).filter(k => k < viewMonth).sort(),
    [state.budgets, viewMonth]
  );
  const prevMonthStr = budgetsList.length > 0 ? budgetsList[budgetsList.length - 1] : null;

  // Has budget entries in current viewMonth
  const hasCurrentBudgets = useMemo(
    () => Boolean(state.budgets[viewMonth] && (Object.values(state.budgets[viewMonth]) as number[]).some(v => (v || 0) > 0)),
    [state.budgets, viewMonth]
  );

  // Group Collapsing / Expand
  const handleCopyPrev = () => {
    if (prevMonthStr) {
      copyBudgets(prevMonthStr, viewMonth);
      onSetToast(`Copied budgets from ${monthLabelShort(prevMonthStr)}`, null, undefined);
    }
  };

  const calculateTargetProgress = (cat: Category, assigned: number, available: number) => {
    if (!cat.target) return null;
    const tg = cat.target;

    if (tg.type === 'monthly' || tg.type === 'monthly_builder') {
      const pct = tg.amount > 0 ? assigned / tg.amount : (assigned > 0 ? 1 : 0);
      return { pct: Math.min(pct, 1.5), funded: assigned >= tg.amount, over: available < 0 };
    }
    if (tg.type === 'by_date') {
      const pct = tg.amount > 0 ? available / tg.amount : (available > 0 ? 1 : 0);
      return { pct: Math.min(Math.max(pct, 0), 1.5), funded: available >= tg.amount, over: available < 0 };
    }
    return null;
  };

  const getAvailClass = (cat: Category, avail: number, targetProgress: ReturnType<typeof calculateTargetProgress>): string => {
    if (avail < 0) return 'bg-red-50 text-red-700 border border-red-200';
    
    if (!cat.target) {
      return avail > 0 
        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
        : 'bg-gray-100 text-gray-500 border border-gray-200/50';
    }
    
    if (!targetProgress) {
      return avail > 0 
        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
        : 'bg-gray-100 text-gray-500 border border-gray-200/50';
    }

    if (targetProgress.over) return 'bg-red-50 text-red-700 border border-red-200';
    if (!targetProgress.funded && avail >= 0) return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-emerald-50 text-emerald-800 border border-emerald-100';
  };

  const getCategoryStatusText = (cat: Category, assigned: number, avail: number) => {
    if (avail < 0) {
      return { cls: 'text-red-650 font-bold', text: `Overspent ${fmtCompact(-avail)}` };
    }
    
    if (cat.target) {
      let gap = 0;
      if (cat.target.type === 'by_date') {
        gap = Math.max(0, cat.target.amount - avail);
      } else {
        gap = Math.max(0, cat.target.amount - assigned);
      }
      
      if (gap > 0) {
        return { cls: 'text-amber-600 font-bold', text: `Underfunded by ${fmtCompact(gap)}` };
      }
      return { cls: 'text-emerald-700 font-semibold', text: 'Fully Funded' };
    }
    
    if (avail > 0) {
      return { cls: 'text-gray-400', text: `Available ${fmtCompact(avail)}` };
    }
    return { cls: 'text-gray-400', text: 'No target' };
  };

  const categoryMetrics = useMemo(() => {
    return Object.fromEntries(state.categories.map(cat => {
      const assigned = getAssigned(cat.id, viewMonth);
      const spent = getSpent(cat.id, viewMonth);
      const available = getAvailable(cat.id, viewMonth);
      const targetProgress = calculateTargetProgress(cat, assigned, available);

      return [cat.id, {
        assigned,
        spent,
        available,
        targetProgress,
        availClass: getAvailClass(cat, available, targetProgress),
        status: getCategoryStatusText(cat, assigned, available)
      }];
    }));
  }, [state, viewMonth]);

  // Inline key/blur triggers
  const startEditing = (catId: string, currentAmount: number) => {
    setEditingCatId(catId);
    setEditValue(currentAmount > 0 ? String(currentAmount) : '');
  };

  const saveInlineEdit = (catId: string) => {
    if (editingCatId !== catId) return;
    
    // Parse the value carefully supporting k/m suffixes
    let cleanVal = editValue.trim().toLowerCase().replace(/\s/g, '').replace(/rp/gi, '');
    let finalAmount = 0;
    
    if (/^[\d.,]+[km]$/.test(cleanVal)) {
      const suffix = cleanVal.slice(-1);
      const parsedFloat = parseFloat(cleanVal.slice(0, -1).replace(/,/g, '.'));
      if (!isNaN(parsedFloat)) {
        finalAmount = Math.round(parsedFloat * (suffix === 'k' ? 1e3 : 1e6));
      }
    } else {
      if ((cleanVal.match(/\./g) || []).length > 1 || /\.\d{3}($|\D)/.test(cleanVal)) {
        cleanVal = cleanVal.replace(/\./g, '');
      }
      const parsedFloat = parseFloat(cleanVal.replace(/,/g, ''));
      if (!isNaN(parsedFloat)) {
        finalAmount = Math.round(parsedFloat);
      }
    }

    setAssigned(catId, viewMonth, finalAmount);
    setEditingCatId(null);
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, catId: string) => {
    if (e.key === 'Enter') {
      saveInlineEdit(catId);
    }
    if (e.key === 'Escape') {
      setEditingCatId(null);
    }
  };

  // SPENDING ANALYTICS COMPILATIONS
  const {
    totalSpentAll,
    totalAssignedAll,
    totalAvailableAll,
    groupAnalytics
  } = useMemo(() => {
    const totalSpent = state.categories.reduce((sum, c) => sum + categoryMetrics[c.id].spent, 0);
    const totalAssigned = state.categories.reduce((sum, c) => sum + categoryMetrics[c.id].assigned, 0);
    const totalAvailable = state.categories.reduce((sum, c) => sum + categoryMetrics[c.id].available, 0);

    const analytics = state.groups.map(group => {
      const groupCats = state.categories.filter(c => c.groupId === group.id);
      const groupSpent = groupCats.reduce((sum, c) => sum + categoryMetrics[c.id].spent, 0);
      const groupAssigned = groupCats.reduce((sum, c) => sum + categoryMetrics[c.id].assigned, 0);
      const pctOfAllSpending = totalSpent > 0 ? (groupSpent / totalSpent) * 100 : 0;
      const usagePct = groupAssigned > 0 ? (groupSpent / groupAssigned) * 100 : 0;
      const color = getGroupColor(group.id);

      return {
        group,
        spent: groupSpent,
        assigned: groupAssigned,
        pctOfAllSpending,
        usagePct,
        color,
        categories: groupCats.map(c => ({
          id: c.id,
          name: c.name,
          spent: categoryMetrics[c.id].spent,
          assigned: categoryMetrics[c.id].assigned,
          available: categoryMetrics[c.id].available
        })).sort((a, b) => b.spent - a.spent)
      };
    }).sort((a, b) => b.spent - a.spent);

    return {
      totalSpentAll: totalSpent,
      totalAssignedAll: totalAssigned,
      totalAvailableAll: totalAvailable,
      groupAnalytics: analytics
    };
  }, [categoryMetrics, state.categories, state.groups]);

  const incMonth = totalIncome(viewMonth);
  const savingsAmount = Math.max(0, incMonth - totalSpentAll);
  const savingsRate = incMonth > 0 ? (savingsAmount / incMonth) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white" id="budget-tab-wrapper">
      {/* Dynamic Sub-view Navigation Toggles */}
      <div className="bg-white border-b border-gray-100 p-2.5 flex items-center gap-2 select-none shrink-0" id="budget-view-tabs">
        <button
          onClick={() => setBudgetSubView('envelopes')}
          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 border select-none ${
            budgetSubView === 'envelopes'
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
              : 'text-gray-500 hover:bg-gray-50 border-gray-200/70'
          }`}
          id="btn-subview-envelopes"
        >
          <Layers size={13} />
          <span>Envelope Budget</span>
        </button>
        <button
          onClick={() => setBudgetSubView('analysis')}
          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 border select-none ${
            budgetSubView === 'analysis'
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
              : 'text-gray-500 hover:bg-gray-50 border-gray-200/70'
          }`}
          id="btn-subview-analysis"
        >
          <TrendingUp size={13} />
          <span>Spending Analysis</span>
        </button>
      </div>

      {budgetSubView === 'envelopes' ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto" id="budget-tab-view">
          {/* Table grid Column headers */}
          <div className="grid grid-cols-[1fr_72px_58px_66px] sm:grid-cols-[1fr_80px_72px_76px] gap-0 px-4 py-2 border-b border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none shrink-0" id="budget-headings">
            <div className="text-left">Category</div>
            <div className="text-right">Assigned</div>
            <div className="text-right">Spent</div>
            <div className="text-right">Available</div>
          </div>

          {/* Copy last budget prompt */}
          {!hasCurrentBudgets && prevMonthStr && (
            <div className="p-3 bg-emerald-50/45 border-b border-emerald-100 text-center text-xs text-gray-600 flex items-center justify-center gap-1.5 select-none shrink-0 border-dashed" id="budget-copy-banner">
              <span>No budgets set for this month yet — </span>
              <button
                onClick={handleCopyPrev}
                className="text-emerald-800 hover:underline font-bold"
                id="budget-copy-action-btn"
              >
                copy from {monthLabelShort(prevMonthStr)}
              </button>
            </div>
          )}

          {/* Groups and Category Rows */}
          <div className="divide-y divide-gray-100/55 overflow-y-auto flex-1 select-none" id="budget-matrix">
            {state.groups
              .slice()
              .sort((a, b) => a.sort - b.sort)
              .map(group => {
                const groupCats = state.categories
                  .filter(c => c.groupId === group.id)
                  .sort((a, b) => a.sort - b.sort);

                const groupAvailTotal = groupCats.reduce((sum, c) => sum + categoryMetrics[c.id].available, 0);
                const groupColor = getGroupColor(group.id);

                return (
                  <div key={group.id} className="bg-white hover:bg-gray-50/10" id={`group-wrapper-${group.id}`}>
                    {/* Collapsible Group Header */}
                    <div
                      onClick={() => toggleGroupCollapsed(group.id)}
                      className="flex items-center justify-between py-2 px-4 bg-gray-50 border-b border-gray-100 hover:bg-gray-100/70 select-none cursor-pointer group transition duration-150"
                      style={{ borderLeft: `3px solid ${groupColor}` }}
                      id={`group-header-${group.id}`}
                    >
                      <div className="flex items-center gap-2" id={`group-header-left-${group.id}`}>
                        <ChevronDown
                          size={13}
                          className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${group.collapsed ? '-rotate-90' : ''}`}
                        />
                        <span 
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: groupColor }}
                          id={`group-title-${group.id}`}
                        >
                          {group.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3" id={`group-header-right-${group.id}`}>
                        <span className="text-[10px] font-bold font-mono text-gray-400 group-hover:text-gray-650" id={`group-sum-${group.id}`}>
                          {fmtCompact(groupAvailTotal)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddCategoryClick(group.id);
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white active:bg-gray-200 text-gray-400 hover:text-emerald-700 transition duration-150"
                          title="Add Category"
                          id={`group-add-btn-${group.id}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Categories within this group */}
                    {!group.collapsed && (
                      <div className="divide-y divide-gray-55/40" id={`group-cats-list-${group.id}`}>
                        {groupCats.length === 0 ? (
                          <div className="py-2.5 px-6 text-xs text-gray-400 italic bg-gray-50/20" id={`group-empty-${group.id}`}>
                            No categories in this group
                          </div>
                        ) : (
                          groupCats.map(cat => {
                            const metrics = categoryMetrics[cat.id];
                            const assignedValue = metrics.assigned;
                            const spentValue = metrics.spent;
                            const availableValue = metrics.available;

                            const isCurrentlyEditing = editingCatId === cat.id;
                            const availStyleCls = metrics.availClass;
                            const status = metrics.status;
                            const targetProgress = metrics.targetProgress;

                            // Visual progress calculation
                            const progressPct = targetProgress 
                              ? Math.min(targetProgress.pct * 100, 100)
                              : (assignedValue > 0 ? Math.min((spentValue / assignedValue) * 100, 100) : 0);

                            const progressFillColor = targetProgress
                              ? (targetProgress.over ? 'bg-red-500' : targetProgress.funded ? 'bg-emerald-600' : 'bg-amber-400')
                              : (spentValue > assignedValue && assignedValue > 0 ? 'bg-red-500' : assignedValue > 0 && spentValue / assignedValue > 0.75 ? 'bg-amber-400' : 'bg-emerald-600');

                            return (
                              <div
                                key={cat.id}
                                className="grid grid-cols-[1fr_72px_58px_66px] sm:grid-cols-[1fr_80px_72px_76px] items-center gap-0 px-4 py-2 hover:bg-slate-50/50 transition duration-150 group/row relative"
                                id={`cat-row-${cat.id}`}
                              >
                                {/* Left Side: Click triggers detailed BottomSheet */}
                                <div 
                                  onClick={() => onCategoryClick(cat)}
                                  className="flex items-center gap-2 min-w-0 pr-2 select-none cursor-pointer"
                                  id={`cat-info-${cat.id}`}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: groupColor }} id={`cat-dot-${cat.id}`} />
                                  <div className="min-w-0 flex flex-col flex-1" id={`cat-texts-${cat.id}`}>
                                    <div className="text-xs font-semibold text-gray-800 flex items-center gap-1.5 min-w-0" id={`cat-name-badge-wrapper-${cat.id}`}>
                                      <span className="truncate pr-1" id={`cat-name-span-${cat.id}`}>{cat.name}</span>
                                      {cat.target && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onSetTargetClick(cat);
                                          }}
                                          className="text-[9px] font-bold text-slate-400 bg-slate-100 flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono tracking-wider cursor-pointer shrink-0 hover:bg-emerald-50 hover:text-emerald-800 transition"
                                          title={`${cat.target.type === 'monthly' ? 'Monthly' : cat.target.type === 'by_date' ? 'By Date' : 'Monthly Builder'} Target: ${fmtCompact(cat.target.amount)}`}
                                          id={`cat-target-badge-${cat.id}`}
                                        >
                                          <TargetIcon size={9} />
                                          {fmtCompact(cat.target.amount)}
                                        </button>
                                      )}
                                    </div>
                                    <span className={`text-[10px] font-medium tracking-tight mt-0.5 ${status.cls}`} id={`cat-status-${cat.id}`}>
                                      {status.text}
                                    </span>
                                  </div>
                                </div>

                                {/* Assigned budget center cell */}
                                <div className="text-right px-1 shrink-0" id={`cat-assigned-spot-${cat.id}`}>
                                  {isCurrentlyEditing ? (
                                    <input
                                      id={`inline-input-${cat.id}`}
                                      type="text"
                                      autoFocus
                                      value={editValue}
                                      placeholder="0"
                                      className="w-[72px] text-right font-mono font-bold text-xs p-1 border-b-2 border-emerald-600 bg-emerald-50 outline-none rounded-t"
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={() => saveInlineEdit(cat.id)}
                                      onKeyDown={(e) => handleInlineKeyDown(e, cat.id)}
                                    />
                                  ) : (
                                    <button
                                      onClick={() => startEditing(cat.id, assignedValue)}
                                      className="font-mono text-xs font-semibold text-gray-800 px-2 py-1 rounded border border-transparent hover:border-gray-200/50 hover:bg-slate-100 transition"
                                      id={`cat-assigned-${cat.id}`}
                                    >
                                      {assignedValue > 0 ? fmtCompact(assignedValue) : '—'}
                                    </button>
                                  )}
                                </div>

                                {/* Activity (Spent) cell */}
                                <div className="text-right px-1 shrink-0" id={`cat-spent-${cat.id}`}>
                                  <button
                                    onClick={() => onActivityClick(cat)}
                                    className="font-mono text-xs font-medium text-gray-400 px-2 py-1 rounded border border-transparent hover:border-gray-200/50 hover:bg-slate-100 transition"
                                    id={`cat-spent-btn-${cat.id}`}
                                  >
                                    {spentValue > 0 ? `-${fmtCompact(spentValue)}` : '—'}
                                  </button>
                                </div>

                                {/* Flow rightmost available badge */}
                                <div className="flex justify-end pr-1.5 shrink-0" id={`cat-avail-spot-${cat.id}`}>
                                  <button
                                    onClick={() => onMoveMoneyClick(cat)}
                                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full select-none transition hover:brightness-95 active:scale-95 ${availStyleCls}`}
                                    id={`cat-avail-badge-${cat.id}`}
                                  >
                                    {fmtCompact(availableValue)}
                                  </button>
                                </div>

                                {/* Interactive progress mini-bar */}
                                <div className="absolute bottom-0 left-[35px] right-[16px] h-[2px] bg-gray-150/50 rounded-full" id={`cat-progress-bg-${cat.id}`}>
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${progressFillColor}`}
                                    style={{ width: `${progressPct}%` }}
                                    id={`cat-progress-fill-${cat.id}`}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        /* SPENDING ANALYSIS VIEW */
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-4 select-none" id="spending-analysis-tab">
          {/* Header stating month of analysis */}
          <div className="flex items-center justify-between px-1" id="analysis-header-month">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Analysis for {monthLabel(viewMonth)}
            </h3>
          </div>

          {/* Overall Stats Grid Cards */}
          <div className="grid grid-cols-2 gap-3" id="analysis-bento-grid">
            <div className="bg-white border border-gray-150 p-4 rounded-lg shadow-sm" id="card-total-spent">
              <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <ShoppingBag size={12} className="text-red-400" />
                <span>Spending</span>
              </div>
              <div className="text-xl font-bold font-mono text-gray-800">
                {fmtIDR(totalSpentAll)}
              </div>
              <div className="text-[10px] text-gray-450 mt-1 font-semibold">
                Of total assigned <span className="text-gray-700 font-mono font-bold">{fmtCompact(totalAssignedAll)}</span>
              </div>
            </div>

            <div className="bg-white border border-gray-150 p-4 rounded-lg shadow-sm" id="card-savings-rate">
              <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <PieChart size={12} className="text-emerald-500" />
                <span>Savings Rate</span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-800">
                {savingsRate.toFixed(1)}%
              </div>
              <div className="text-[10px] text-gray-450 mt-1 font-semibold flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                <span>Saved <span className="font-mono">{fmtCompact(savingsAmount)}</span></span>
              </div>
            </div>
          </div>

          {/* Group Wise Segment Analysis List */}
          <div className="space-y-3" id="analysis-group-list">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
              Spending Details by Category Group
            </div>

            {totalSpentAll === 0 ? (
              <div className="bg-white border border-gray-150 rounded-lg p-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2" id="analysis-empty-state">
                <Activity size={24} className="text-gray-300 animate-pulse" />
                <span>No spending history found for this month ({monthLabel(viewMonth)}).</span>
                <span>Assign funds in 'Envelope Budget' and add transaction records.</span>
              </div>
            ) : (
              groupAnalytics.map(({ group, spent, assigned, pctOfAllSpending, usagePct, color, categories }) => {
                const hasUsage = spent > 0 || assigned > 0;
                if (!hasUsage) return null; // do not show unused empty groups in analysis

                return (
                  <div 
                    key={group.id} 
                    className="bg-white border border-gray-150 rounded-lg overflow-hidden shadow-sm" 
                    id={`analysis-group-card-${group.id}`}
                  >
                    {/* Header Details */}
                    <div 
                      className="p-3.5 border-b border-gray-100 flex items-center justify-between gap-3"
                      style={{ borderLeft: `4px solid ${color}` }}
                      id={`analysis-group-head-${group.id}`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">{group.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                          {pctOfAllSpending.toFixed(1)}% of all spending
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-gray-850 font-mono">{fmtIDR(spent)}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">SPENT</div>
                      </div>
                    </div>

                    {/* Progress Bar & Sub list */}
                    <div className="p-3.5 space-y-4" id={`analysis-group-body-${group.id}`}>
                      {/* Budget Usage Gauge bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold" id={`analysis-gauge-texts-${group.id}`}>
                          <span>Budget Usage Progress</span>
                          <span className="font-mono font-bold text-gray-700">{assigned > 0 ? `${usagePct.toFixed(0)}%` : 'No Budget Assigned'}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden" id={`analysis-gauge-bg-${group.id}`}>
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(usagePct, 100)}%`,
                              backgroundColor: usagePct > 100 ? '#ef4444' : color 
                            }}
                          />
                        </div>
                        <div className="text-[9px] text-gray-400 flex justify-between font-medium">
                          <span>Spent: {fmtCompact(spent)}</span>
                          <span>Budget: {fmtCompact(assigned)}</span>
                        </div>
                      </div>

                      {/* Mini Category Row Spending Details (Top spenders first) */}
                      <div className="space-y-2 pt-1 border-t border-gray-50 bg-gray-50/20 p-2 rounded-md" id={`analysis-cat-minilist-${group.id}`}>
                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-2">INDIVIDUAL ITEMS</div>
                        {categories.map(cat => {
                          const catPct = spent > 0 ? (cat.spent / spent) * 100 : 0;
                          if (cat.spent === 0 && cat.assigned === 0) return null;
                          return (
                            <div 
                              key={cat.id} 
                              onClick={() => onCategoryClick({ id: cat.id, name: cat.name, groupId: group.id, sort: 0, emoji: '', target: null })}
                              className="flex items-center justify-between gap-2 text-[11px] hover:bg-gray-100/50 p-1 rounded cursor-pointer transition"
                              id={`analysis-cat-row-${cat.id}`}
                            >
                              <div className="min-w-0 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <span className="font-semibold text-gray-700 truncate">{cat.name}</span>
                                {catPct > 0 && (
                                  <span className="text-[9px] bg-gray-100 px-1 py-0.2 rounded text-gray-400 font-bold font-mono">
                                    {catPct.toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              <div className="text-right shrink-0 font-mono font-medium text-gray-600">
                                {fmtCompact(cat.spent)}
                                <span className="text-[9px] text-gray-400 font-normal ml-1">
                                  / {fmtCompact(cat.available + cat.spent)} total available
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
