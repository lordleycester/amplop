/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmtIDR, fmtCompact, monthLabelShort } from '../utils/helpers';
import { 
  Pencil, Trash2, Plus, Play, Pause, CreditCard, Calendar, Cloud, Save, RefreshCw, Trash, Upload, Download, FileSpreadsheet, Lock, ArrowUp, ArrowDown
} from 'lucide-react';
import { Category, Group, Account, Installment, Recurring, SyncConfig } from '../types';

interface SettingsTabProps {
  // Groups
  onAddGroupClick: () => void;
  onEditGroupClick: (group: Group) => void;
  onDeleteGroupClick: (group: Group) => void;
  onAddCategoryClick: (groupId: string) => void;
  // Categories
  onEditCategoryClick: (cat: Category) => void;
  onDeleteCategoryClick: (cat: Category) => void;
  // Accounts
  onAddAccountClick: () => void;
  onEditAccountClick: (acc: Account) => void;
  onDeleteAccountClick: (acc: Account) => void;
  // Installments
  onAddInstallmentClick: () => void;
  onEditInstallmentClick: (inst: Installment) => void;
  onDeleteInstallmentClick: (inst: Installment) => void;
  // Recurring
  onAddRecurringClick: () => void;
  onEditRecurringClick: (rec: Recurring) => void;
  onDeleteRecurringClick: (rec: Recurring) => void;
  // Toast & Sync callbacks
  onSetToast: (msg: string, actionLabel?: string | null, actionFn?: () => void) => void;
  onShowConfirm: (title: string, msg: string, confirmFn: () => void) => void;
}

// AES-GCM Local-Encryption utilities matching the original HTML for zero-knowledge secure cloud syncing
function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
}

function b64ToBytes(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function syncKey(passphrase: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: 210000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(text: string, passphrase: string): Promise<any> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await syncKey(passphrase, salt);
  const plain = new TextEncoder().encode(text);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  return {
    v: 1,
    alg: 'AES-GCM',
    kdf: 'PBKDF2-SHA256',
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    data: bytesToB64(cipher)
  };
}

async function decryptData(payload: any, passphrase: string): Promise<string> {
  const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const salt = b64ToBytes(parsed.salt);
  const iv = b64ToBytes(parsed.iv);
  const key = await syncKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    b64ToBytes(parsed.data)
  );
  return new TextDecoder().decode(plain);
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onAddGroupClick,
  onEditGroupClick,
  onDeleteGroupClick,
  onAddCategoryClick,
  onEditCategoryClick,
  onDeleteCategoryClick,
  onAddAccountClick,
  onEditAccountClick,
  onDeleteAccountClick,
  onAddInstallmentClick,
  onEditInstallmentClick,
  onDeleteInstallmentClick,
  onAddRecurringClick,
  onEditRecurringClick,
  onDeleteRecurringClick,
  onSetToast,
  onShowConfirm
}) => {
  const { 
    state, viewMonth, toggleRecurringActive, clearAllData, importBackup, saveSyncConfig, getSyncConfig, getAccountBalance, moveGroup, moveCategory
  } = useBudget();

  // Local Sync Settings form state
  const [syncUrl, setSyncUrl] = useState(() => getSyncConfig().url || '');
  const [syncKey, setSyncKey] = useState(() => getSyncConfig().anonKey || '');
  const [syncId, setSyncId] = useState(() => getSyncConfig().syncId || 'default');
  const [syncPass, setSyncPass] = useState(() => getSyncConfig().passphrase || '');

  // Installment end date helper
  const _instEndDate = (inst: Installment): string => {
    let [y, mo] = inst.startDate.split('-').map(Number);
    mo += inst.totalMonths - 1;
    while (mo > 12) {
      mo -= 12;
      y++;
    }
    return y + '-' + String(mo).padStart(2, '0');
  };

  const _instIsActive = (inst: Installment, m: string): boolean => {
    const end = _instEndDate(inst);
    return m >= inst.startDate && m <= end;
  };

  const _instIsCompleted = (inst: Installment, m: string): boolean => {
    return m > _instEndDate(inst);
  };

  const _instRemainingMonths = (inst: Installment, m: string): number => {
    const end = _instEndDate(inst);
    if (m > end) return 0;
    if (m < inst.startDate) return inst.totalMonths;
    const [cy, cm] = m.split('-').map(Number);
    const [ey, em] = end.split('-').map(Number);
    return (ey - cy) * 12 + (em - cm) + 1;
  };

  // Group Collapsing/Coloring
  const getGroupColor = (groupId: string): string => {
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
  };

  // Import file triggers
  const handleImportClick = () => {
    document.getElementById('import-file-input')?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const success = importBackup(parsed);
        if (success) {
          onSetToast('Backup imported successfully!', null, undefined);
        } else {
          alert('Invalid JSON backup file or missing fields.');
        }
      } catch (err) {
        alert('Could not parse backing file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // clear input selection
  };

  // Export templates
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amplop-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onSetToast('Backup file downloaded', null, undefined);
  };

  const handleExportCSV = () => {
    let csv = 'Date,Type,Category,Account,Amount,Note\n';
    const rawItems: any[] = [];

    state.transactions.forEach(t => {
      const cat = state.categories.find(c => c.id === t.catId);
      const acc = state.accounts.find(a => a.id === t.accountId);
      rawItems.push({ date: t.date, type: 'Expense', cat: cat?.name || 'Unknown', acc: acc?.name || '', amount: -t.amount, note: t.note || '' });
    });

    state.income.forEach(i => {
      const acc = state.accounts.find(a => a.id === i.accountId);
      rawItems.push({ date: i.date, type: 'Income', cat: 'Income', acc: acc?.name || '', amount: i.amount, note: i.note || '' });
    });

    state.transfers.forEach(tf => {
      const fromAcc = state.accounts.find(a => a.id === tf.fromAccountId);
      const toAcc   = state.accounts.find(a => a.id === tf.toAccountId);
      rawItems.push({ date: tf.date, type: 'Transfer', cat: '', acc: `${fromAcc?.name || '?'} → ${toAcc?.name || '?'}`, amount: 0, note: tf.note || '' });
    });

    rawItems.sort((a, b) => a.date.localeCompare(b.date));
    rawItems.forEach(i => {
      csv += `${i.date},${i.type},"${i.cat}","${i.acc}",${i.amount},"${(i.note || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amplop-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onSetToast('Transactions exported as CSV', null, undefined);
  };

  const handleResetData = () => {
    onShowConfirm(
      'Reset All Data?',
      'This will permanently delete all envelopes, accounts, transactions, and installments. Back up your data first.',
      () => {
        clearAllData();
        onSetToast('All data cleared.', null, undefined);
      }
    );
  };

  // Sync mutations
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const handleSaveSync = () => {
    const config: SyncConfig = {
      url: syncUrl.trim(),
      anonKey: syncKey.trim(),
      syncId: syncId.trim(),
      passphrase: syncPass
    };
    saveSyncConfig(config);
    onSetToast('Cloud sync config saved local', null, undefined);
  };

  const handlePushCloud = async () => {
    if (!syncUrl.trim() || !syncKey.trim() || !syncId.trim()) {
      onSetToast('Please fill in Supabase URL, Anon Key and Sync ID first.', 'error', undefined);
      return;
    }
    if (!syncPass) {
      onSetToast('Please enter a Passphrase to encrypt your backup.', 'error', undefined);
      return;
    }

    setIsPushing(true);
    try {
      // 1. Encrypt state
      const stateStr = JSON.stringify(state);
      const encrypted = await encryptData(stateStr, syncPass);

      // 2. Perform bulk-insert upsert on conflict of 'id' column
      const cleanUrl = syncUrl.trim().replace(/\/$/, "");
      const findUrl = `${cleanUrl}/rest/v1/amplop_sync?on_conflict=id`;
      const now = new Date().toISOString();
      
      const res = await fetch(findUrl, {
        method: 'POST',
        headers: {
          'apikey': syncKey.trim(),
          'Authorization': `Bearer ${syncKey.trim()}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify([{ id: syncId.trim(), payload: encrypted, updated_at: now }])
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Sync failed: ${errorText || res.statusText}`);
      }

      // Also auto-save the sync settings locally on successful push
      saveSyncConfig({
        url: syncUrl.trim(),
        anonKey: syncKey.trim(),
        syncId: syncId.trim(),
        passphrase: syncPass
      });

      onSetToast('Data successfully pushed and encrypted in the cloud!', null, undefined);
    } catch (err: any) {
      console.error(err);
      onSetToast(`Push failed: ${err.message || err}`, 'error', undefined);
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullCloud = async () => {
    if (!syncUrl.trim() || !syncKey.trim() || !syncId.trim()) {
      onSetToast('Please fill in Supabase URL, Anon Key and Sync ID first.', 'error', undefined);
      return;
    }
    if (!syncPass) {
      onSetToast('Please enter your Passphrase to decrypt data.', 'error', undefined);
      return;
    }

    setIsPulling(true);
    try {
      const cleanUrl = syncUrl.trim().replace(/\/$/, "");
      const findUrl = `${cleanUrl}/rest/v1/amplop_sync?id=eq.${encodeURIComponent(syncId.trim())}&select=payload,updated_at`;
      
      const res = await fetch(findUrl, {
        headers: {
          'apikey': syncKey.trim(),
          'Authorization': `Bearer ${syncKey.trim()}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to pull: ${res.statusText}`);
      }

      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        onSetToast(`No backup found under Sync ID "${syncId.trim()}"`, 'error', undefined);
        return;
      }

      const payload = rows[0].payload;
      if (!payload) {
        throw new Error(`No payload data found in database row`);
      }

      // Decrypt
      let decryptedStr;
      try {
        decryptedStr = await decryptData(payload, syncPass);
      } catch (decErr) {
        throw new Error(`Decryption failed! Please verify your Passphrase key.`);
      }

      const parsedState = JSON.parse(decryptedStr);
      const success = importBackup(parsedState);
      
      if (success) {
        // Also auto-save the sync settings locally on successful pull
        saveSyncConfig({
          url: syncUrl.trim(),
          anonKey: syncKey.trim(),
          syncId: syncId.trim(),
          passphrase: syncPass
        });
        onSetToast('Successfully pulled and loaded database cloud backup!', null, undefined);
      } else {
        throw new Error('Data format in the backup is invalid for current version.');
      }
    } catch (err: any) {
      console.error(err);
      onSetToast(`Pull failed: ${err.message || err}`, 'error', undefined);
    } finally {
      setIsPulling(false);
    }
  };

  // Grouped installments
  const activeInst = state.installments.filter(i => _instIsActive(i, viewMonth));
  const upcomingInst = state.installments.filter(i => i.startDate > viewMonth);
  const completedInst = state.installments.filter(i => _instIsCompleted(i, viewMonth));

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 pb-12 select-none" id="settings-tab-view">
      
      {/* Category Groups Section */}
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 px-4 bg-gray-100 select-none shrink-0" id="settings-sec-head-groups">
        Category Groups
      </div>

      <div className="divide-y divide-gray-200 bg-white" id="settings-groups-list">
        {state.groups
          .slice()
          .sort((a, b) => a.sort - b.sort)
          .map(g => {
            const groupCats = state.categories.filter(c => c.groupId === g.id).sort((a, b) => a.sort - b.sort);
            const groupColor = getGroupColor(g.id);

            return (
              <div key={g.id} className="p-1" id={`settings-gbox-${g.id}`}>
                {/* Group Heading Header Row */}
                <div className="flex items-center justify-between py-2 px-4 border-b border-gray-100 bg-gray-50/50" style={{ borderLeft: `3px solid ${groupColor}` }} id={`settings-ghead-${g.id}`}>
                  <span className="text-xs font-bold font-sans uppercase tracking-wide" style={{ color: groupColor }} id={`settings-gtxt-${g.id}`}>{g.name}</span>
                  <div className="flex gap-2" id={`settings-gcontrols-${g.id}`}>
                    <button
                      onClick={() => moveGroup(g.id, 'up')}
                      className="p-1 rounded hover:bg-white text-gray-400 hover:text-emerald-700 transition"
                      title="Move Group Up"
                      id={`settings-g-move-up-${g.id}`}
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => moveGroup(g.id, 'down')}
                      className="p-1 rounded hover:bg-white text-gray-400 hover:text-emerald-700 transition"
                      title="Move Group Down"
                      id={`settings-g-move-down-${g.id}`}
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      onClick={() => onEditGroupClick(g)}
                      className="p-1 rounded hover:bg-white text-gray-400 hover:text-emerald-700 transition"
                      title="Rename Group"
                      id={`settings-g-edit-${g.id}`}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => onDeleteGroupClick(g)}
                      className="p-1 rounded hover:bg-white text-gray-400 hover:text-red-600 transition"
                      title="Delete Group"
                      id={`settings-g-del-${g.id}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                <div className="divide-y divide-gray-50" id={`settings-g-cats-${g.id}`}>
                  {groupCats.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3" id={`settings-cat-row-${c.id}`}>
                      <div className="flex items-center gap-2 min-w-0" id={`settings-cat-label-${c.id}`}>
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: groupColor }} />
                        <div className="text-xs font-semibold text-gray-700 truncate">{c.name}</div>
                      </div>
                      
                      <div className="flex gap-2" id={`settings-cat-controls-${c.id}`}>
                        <button
                          onClick={() => moveCategory(c.id, 'up')}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-emerald-700 transition"
                          title="Move Category Up"
                          id={`settings-c-move-up-${c.id}`}
                        >
                          <ArrowUp size={11} />
                        </button>
                        <button
                          onClick={() => moveCategory(c.id, 'down')}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-emerald-700 transition"
                          title="Move Category Down"
                          id={`settings-c-move-down-${c.id}`}
                        >
                          <ArrowDown size={11} />
                        </button>
                        <button
                          onClick={() => onEditCategoryClick(c)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-emerald-700 transition"
                          id={`settings-c-edit-${c.id}`}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => onDeleteCategoryClick(c)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition"
                          id={`settings-c-del-${c.id}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => onAddCategoryClick(g.id)}
                    className="w-full text-left py-2.5 px-4 text-xs font-bold text-emerald-800 hover:bg-gray-100 flex items-center gap-1.5 transition"
                    id={`settings-g-addcat-btn-${g.id}`}
                  >
                    <Plus size={13} />
                    Add category to {g.name}
                  </button>
                </div>
              </div>
            );
          })}
        
        <button
          onClick={onAddGroupClick}
          className="w-full text-left py-3 px-5 text-xs font-bold text-emerald-800 hover:bg-gray-100 flex items-center gap-1.5 bg-white border-t border-gray-200 transition"
          id="settings-add-group-btn"
        >
          <Plus size={14} />
          + Add Group
        </button>
      </div>

      {/* Account Manage section */}
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 px-4 bg-gray-100 mt-5" id="settings-sec-head-accounts">
        Accounts
      </div>

      <div className="bg-white divide-y divide-gray-150 overflow-hidden" id="settings-accounts-list">
        {state.accounts.map(acc => {
          const balance = getAccountBalance(acc.id);
          return (
            <div key={acc.id} className="flex items-center justify-between p-3 hover:bg-slate-50/50" id={`settings-acc-row-${acc.id}`}>
              <div className="min-w-0" id={`settings-acc-info-${acc.id}`}>
                <div className="text-xs font-semibold text-gray-800 truncate">{acc.name}</div>
                <div className="text-[9px] font-bold text-gray-400 uppercase mt-0.5 tracking-wider font-mono">
                  {acc.type} · {acc.onBudget ? 'On Budget' : 'Tracking'} · {fmtIDR(balance)}
                </div>
              </div>

              <div className="flex gap-2" id={`settings-acc-controls-${acc.id}`}>
                <button
                  onClick={() => onEditAccountClick(acc)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-emerald-700 transition"
                  id={`settings-a-edit-${acc.id}`}
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => onDeleteAccountClick(acc)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition"
                  id={`settings-a-del-${acc.id}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
        <button
          onClick={onAddAccountClick}
          className="w-full text-left py-3 px-5 text-xs font-bold text-emerald-800 hover:bg-gray-100 flex items-center gap-1.5 transition"
          id="settings-add-account-btn"
        >
          <Plus size={14} />
          + Add Account
        </button>
      </div>

      {/* Installments in settings section */}
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 px-4 bg-gray-100 mt-5" id="settings-sec-head-cicilan">
        Installments
      </div>

      <div className="bg-white divide-y divide-gray-150 overflow-hidden" id="settings-cicilan-list">
        {state.installments.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400 italic">No installments templates configured.</div>
        ) : (
          <>
            {activeInst.map(inst => {
              const remaining = _instRemainingMonths(inst, viewMonth);
              return (
                <div key={inst.id} className="flex items-center justify-between p-3 hover:bg-slate-50" id={`settings-inst-row-${inst.id}`}>
                  <div className="min-w-0" id={`settings-inst-info-${inst.id}`}>
                    <div className="text-xs font-semibold text-gray-800 truncate flex items-center gap-1.5">
                      <CreditCard size={12} className="text-amber-500" />
                      {inst.name}
                    </div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider font-mono">
                      {fmtIDR(inst.monthlyPayment)}/mo · {remaining} mo remaining · Active
                    </div>
                  </div>

                  <div className="flex gap-2" id={`settings-inst-controls-${inst.id}`}>
                    <button
                      onClick={() => onEditInstallmentClick(inst)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-emerald-700 transition"
                      id={`settings-i-edit-${inst.id}`}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => onDeleteInstallmentClick(inst)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition"
                      id={`settings-i-del-${inst.id}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {upcomingInst.map(inst => (
              <div key={inst.id} className="flex items-center justify-between p-3 hover:bg-slate-50 bg-gray-50/30" id={`settings-inst-uprow-${inst.id}`}>
                <div className="min-w-0 opacity-70">
                  <div className="text-xs font-semibold text-gray-800 truncate flex items-center gap-1.5">
                    <CreditCard size={12} className="text-amber-500" />
                    {inst.name}
                  </div>
                  <div className="text-[9px] text-amber-600 font-bold uppercase mt-0.5 tracking-wider font-mono">
                    Starts {monthLabelShort(inst.startDate)} · {inst.totalMonths} mo (Upcoming)
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onEditInstallmentClick(inst)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-emerald-700 transition"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => onDeleteInstallmentClick(inst)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {completedInst.map(inst => (
              <div key={inst.id} className="flex items-center justify-between p-3 hover:bg-slate-50 opacity-50" id={`settings-inst-comprow-${inst.id}`}>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate flex items-center gap-1.5">
                    <CreditCard size={12} className="text-amber-500 opacity-60" />
                    {inst.name}
                  </div>
                  <div className="text-[9px] text-emerald-800 font-bold uppercase mt-0.5 tracking-wider font-mono">
                    Paid Off {monthLabelShort(_instEndDate(inst))} (Paid Off)
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onDeleteInstallmentClick(inst)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
        
        <button
          onClick={onAddInstallmentClick}
          className="w-full text-left py-3 px-5 text-xs font-bold text-emerald-800 hover:bg-gray-100 flex items-center gap-1.5 transition"
          id="settings-add-cicilan-btn"
        >
          <Plus size={14} />
          + Add Installment
        </button>
      </div>

      {/* Recurring Scheduled list */}
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 px-4 bg-gray-100 mt-5" id="settings-sec-head-recurring">
        Recurring template schedules
      </div>

      <div className="bg-white divide-y divide-gray-150 overflow-hidden" id="settings-recurring-list">
        {state.recurring.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400 italic">No recurring schedules added yet.</div>
        ) : (
          state.recurring.slice().sort((a,b) => a.dayOfMonth - b.dayOfMonth).map(rec => {
            const isIncome = rec.type === 'income';
            
            return (
              <div key={rec.id} className={`flex items-center justify-between p-3 ${rec.active ? '' : 'opacity-40'}`} id={`settings-rec-row-${rec.id}`}>
                <div className="min-w-0" id={`settings-rec-info-${rec.id}`}>
                  <div className="text-xs font-semibold text-gray-800 truncate flex items-center gap-1.5">
                    <Calendar size={13} className="text-gray-400" />
                    {rec.name}
                  </div>
                  <div className="text-[9px] font-bold mt-0.5 tracking-wider font-mono uppercase">
                    <span className={isIncome ? 'text-emerald-700' : 'text-red-700'}>
                      {isIncome ? '+' : '−'}{fmtIDR(rec.amount)}
                    </span>
                    {` · Tgl ${rec.dayOfMonth} · `}
                    {rec.active ? <span className="text-blue-600">Active</span> : <span className="text-amber-600">Paused</span>}
                  </div>
                </div>

                <div className="flex gap-1.5" id={`settings-rec-controls-${rec.id}`}>
                  <button
                    onClick={() => toggleRecurringActive(rec.id)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                    title={rec.active ? 'Pause Template' : 'Resume Template'}
                    id={`settings-r-pause-${rec.id}`}
                  >
                    {rec.active ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                  <button
                    onClick={() => onEditRecurringClick(rec)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-emerald-700 transition"
                    id={`settings-r-edit-${rec.id}`}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => onDeleteRecurringClick(rec)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition"
                    id={`settings-r-del-${rec.id}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
        <button
          onClick={onAddRecurringClick}
          className="w-full text-left py-3 px-5 text-xs font-bold text-emerald-800 hover:bg-gray-100 flex items-center gap-1.5 transition"
          id="settings-add-recurring-btn"
        >
          <Plus size={14} />
          + Add Recurring Transaction
        </button>
      </div>

      {/* Cloud Sync setup */}
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 px-4 bg-gray-100 mt-5" id="settings-sec-head-sync">
        Cloud Sync API integration
      </div>

      <div className="p-4 bg-white space-y-4 shadow-sm" id="settings-sync-panel">
        <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-150 leading-relaxed font-semibold">
          Cloud sync uses a standard Supabase table <code className="bg-gray-200 px-1 py-0.5 rounded font-mono font-bold text-red-700">amplop_sync</code> to serialize client data securely encrypted locally using AES-GCM (passphrase is never transmitted).
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Supabase Project URL</label>
            <input 
              type="text"
              value={syncUrl}
              onChange={(e) => setSyncUrl(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs select-all outline-none focus:border-emerald-600 transition"
              placeholder="https://xxxxx.supabase.co"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Anon Public Key</label>
            <input 
              type="text"
              value={syncKey}
              onChange={(e) => setSyncKey(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs select-all outline-none focus:border-emerald-600 transition truncate"
              placeholder="eyJ..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Sync ID</label>
              <input 
                type="text"
                value={syncId}
                onChange={(e) => setSyncId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs select-all outline-none focus:border-emerald-600 transition"
                placeholder="default"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1 tracking-wider flex items-center gap-1">
                <Lock size={9} />
                Passphrase
              </label>
              <input 
                type="password"
                value={syncPass}
                onChange={(e) => setSyncPass(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                placeholder="Needed on each device"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSync}
            className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded shadow transition flex items-center justify-center gap-1.5"
            id="settings-save-sync-btn"
          >
            <Save size={14} />
            Save Sync Settings
          </button>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handlePushCloud}
              disabled={isPushing}
              className="py-2.5 px-4 bg-emerald-800 text-white font-bold text-xs rounded transition flex items-center justify-center gap-1.5"
              id="settings-push-sync-btn"
            >
              <Upload size={14} className={isPushing ? "animate-spin" : ""} />
              {isPushing ? 'Pushing...' : 'Push to Cloud'}
            </button>
            <button
              onClick={handlePullCloud}
              disabled={isPulling}
              className="py-2.5 px-4 bg-emerald-800 text-white font-bold text-xs rounded transition flex items-center justify-center gap-1.5"
              id="settings-pull-sync-btn"
            >
              <Download size={14} className={isPulling ? "animate-spin" : ""} />
              {isPulling ? 'Pulling...' : 'Pull from Cloud'}
            </button>
          </div>
        </div>
      </div>

      {/* Backup and restore panel */}
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 px-4 bg-gray-100 mt-5" id="settings-sec-head-data">
        Local Data Backups
      </div>

      <div className="bg-white shadow-sm overflow-hidden divide-y divide-gray-150" id="settings-backups-panel">
        <button
          onClick={handleExportJSON}
          className="w-full py-3 px-5 hover:bg-gray-50 text-left text-xs font-semibold text-gray-700 flex items-center gap-2 transition"
          id="settings-export-json-btn"
        >
          <Upload size={14} className="text-gray-400" />
          Export JSON Backup
        </button>

        <button
          onClick={handleImportClick}
          className="w-full py-3 px-5 hover:bg-gray-50 text-left text-xs font-semibold text-gray-700 flex items-center gap-2 transition"
          id="settings-import-json-btn"
        >
          <Download size={14} className="text-gray-400" />
          Import JSON Backup
        </button>
        <input 
          type="file" 
          id="import-file-input" 
          accept=".json" 
          className="hidden" 
          onChange={handleImportFileChange}
        />

        <button
          onClick={handleExportCSV}
          className="w-full py-3 px-5 hover:bg-gray-50 text-left text-xs font-semibold text-gray-700 flex items-center gap-2 transition"
          id="settings-export-csv-btn"
        >
          <FileSpreadsheet size={14} className="text-gray-400" />
          Export Transactions (CSV)
        </button>

        <button
          onClick={handleResetData}
          className="w-full py-3.5 px-5 hover:bg-red-50 text-left text-xs font-bold text-red-600 flex items-center gap-2 transition"
          id="settings-wipe-btn"
        >
          <Trash size={14} className="text-red-500" />
          Reset All Data
        </button>
      </div>

    </div>
  );
};
