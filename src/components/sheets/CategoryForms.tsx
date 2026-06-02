/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import type { Category } from '../../types';
import type { BasicFormState, SelectFormState, SheetCallbacks } from './SheetFormProps';

interface CategoryFormProps extends BasicFormState, SelectFormState, SheetCallbacks {
  category?: Category;
}

export const AddCategoryForm: React.FC<CategoryFormProps> = ({
  formName,
  setFormName,
  formSelectedId,
  setFormSelectedId,
  closeSheet,
  showToast
}) => {
  const { state, addCategory } = useBudget();

  return (
    <div className="space-y-4" id="form-add-category">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Category Name</label>
        <input
          type="text"
          autoFocus
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="e.g. Bus Tickets, Coffee"
          className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
          id="form-add-cat-name"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Assign to Group</label>
        <select
          value={formSelectedId}
          onChange={(e) => setFormSelectedId(e.target.value)}
          className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs outline-none"
        >
          {state.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <button
        onClick={() => {
          if (!formName.trim() || !formSelectedId) return;
          addCategory(formName.trim(), '', formSelectedId);
          closeSheet();
          showToast(`Category "${formName}" created`, null, undefined);
        }}
        className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
        id="form-add-cat-submit"
      >
        Add Category
      </button>
    </div>
  );
};

export const EditCategoryForm: React.FC<CategoryFormProps> = ({
  category,
  formName,
  setFormName,
  formSelectedId,
  setFormSelectedId,
  closeSheet,
  showToast
}) => {
  const { state, editCategory } = useBudget();

  return (
    <div className="space-y-4" id="form-edit-category">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Category Name</label>
        <input
          type="text"
          autoFocus
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Group</label>
        <select
          value={formSelectedId}
          onChange={(e) => setFormSelectedId(e.target.value)}
          className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
        >
          {state.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <button
        onClick={() => {
          if (!formName.trim() || !formSelectedId || !category) return;
          editCategory(category.id, formName.trim(), '', formSelectedId);
          closeSheet();
          showToast('Category updated', null, undefined);
        }}
        className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
      >
        Save Changes
      </button>
    </div>
  );
};
