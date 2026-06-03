/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Wallet } from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';
import { fmtIDR } from '../../utils/helpers';
import { getGroupColor } from '../../utils/sharedUtils';

interface AssignReadyToAssignFormProps {
  formSelectedId: string;
  setFormSelectedId: (value: string) => void;
  closeSheet: () => void;
  showToast: (message: string, actionLabel?: string | null, onAction?: (() => void) | null) => void;
}

export const AssignReadyToAssignForm: React.FC<AssignReadyToAssignFormProps> = ({
  formSelectedId,
  setFormSelectedId,
  closeSheet,
  showToast
}) => {
  const { state, viewMonth, getRTA, getAssigned, getAvailable, setAssigned } = useBudget();
  const readyToAssign = getRTA(viewMonth);
  const selectedCategory = state.categories.find(c => c.id === formSelectedId);

  const orderedCategories = state.groups
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .flatMap(group => state.categories
      .filter(cat => cat.groupId === group.id)
      .sort((a, b) => a.sort - b.sort)
      .map(cat => ({ cat, group }))
    );

  const handleAssign = () => {
    if (readyToAssign <= 0) {
      showToast('Nothing left to assign', null, undefined);
      closeSheet();
      return;
    }
    if (!selectedCategory) return;

    const currentAssigned = getAssigned(selectedCategory.id, viewMonth);
    setAssigned(selectedCategory.id, viewMonth, currentAssigned + readyToAssign);
    showToast(`Assigned ${fmtIDR(readyToAssign)} to ${selectedCategory.name}`, null, undefined);
    closeSheet();
  };

  return (
    <div className="space-y-4 font-sans" id="form-assign-rta">
      <div className="text-xs text-gray-500 rounded p-2 border border-gray-150 bg-gray-50 select-none">
        Leftover money: <span className="font-bold font-mono text-emerald-700">{fmtIDR(readyToAssign)}</span>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Choose Category:</label>
        <div className="max-h-[260px] overflow-y-auto divide-y divide-gray-100 rounded-md border border-gray-150 shadow-sm bg-white" id="assign-rta-category-list">
          {orderedCategories.map(({ cat, group }) => {
            const isSelected = formSelectedId === cat.id;
            const dotColor = getGroupColor(cat.groupId);
            const available = getAvailable(cat.id, viewMonth);

            return (
              <button
                key={cat.id}
                onClick={() => setFormSelectedId(cat.id)}
                className={`w-full flex justify-between items-center p-3 select-none text-left transition ${isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50/50'}`}
                id={`assign-rta-row-${cat.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-700 truncate">{cat.name}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{group.name}</div>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-bold font-mono shrink-0">{fmtIDR(available)} av</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleAssign}
        disabled={!selectedCategory || readyToAssign <= 0}
        className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition flex items-center justify-center gap-1.5"
        id="assign-rta-submit-btn"
      >
        <Wallet size={13} />
        Move {fmtIDR(Math.max(0, readyToAssign))}
      </button>
    </div>
  );
};
