/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import type { Group } from '../../types';
import type { BasicFormState, SheetCallbacks } from './SheetFormProps';

interface GroupFormProps extends BasicFormState, SheetCallbacks {
  group?: Group;
}

export const AddGroupForm: React.FC<GroupFormProps> = ({
  formName,
  setFormName,
  closeSheet,
  showToast
}) => {
  const { addGroup } = useBudget();

  return (
    <div className="space-y-4" id="form-add-group">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Group Name</label>
        <input
          type="text"
          autoFocus
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="e.g. Transport, Subscriptions"
          className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
          id="form-add-group-input"
        />
      </div>
      <button
        onClick={() => {
          if (!formName.trim()) return;
          addGroup(formName.trim());
          closeSheet();
          showToast(`Group "${formName}" created`, null, undefined);
        }}
        className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
        id="form-add-group-submit"
      >
        Add Group
      </button>
    </div>
  );
};

export const EditGroupForm: React.FC<GroupFormProps> = ({
  group,
  formName,
  setFormName,
  closeSheet,
  showToast
}) => {
  const { editGroup } = useBudget();

  return (
    <div className="space-y-4" id="form-edit-group">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Group Name</label>
        <input
          type="text"
          autoFocus
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
        />
      </div>
      <button
        onClick={() => {
          if (!formName.trim() || !group) return;
          editGroup(group.id, formName.trim());
          closeSheet();
          showToast('Group renamed', null, undefined);
        }}
        className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
      >
        Save Changes
      </button>
    </div>
  );
};
