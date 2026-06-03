/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { 
  Save, Trash, Upload, Download, FileSpreadsheet, Lock, BookOpen
} from 'lucide-react';
import { SyncConfig } from '../types';

interface SettingsTabProps {
  onOpenGuide: () => void;
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

const sectionHeadingClass = 'settings-section-heading text-[10px] font-bold uppercase tracking-wider py-3 px-4 select-none shrink-0';
const quietButtonClass = 'settings-press-button settings-press-quiet w-full py-3 px-5 text-left text-xs font-bold flex items-center gap-2 transition';
const primaryButtonClass = 'settings-press-button settings-press-primary w-full py-2.5 px-4 font-bold text-xs transition flex items-center justify-center gap-1.5';
const secondaryButtonClass = 'settings-press-button settings-press-secondary py-2.5 px-4 font-bold text-xs transition flex items-center justify-center gap-1.5';
const dangerButtonClass = 'settings-press-button settings-press-danger w-full py-3.5 px-5 text-left text-xs font-bold flex items-center gap-2 transition';

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onOpenGuide,
  onSetToast,
  onShowConfirm
}) => {
  const { 
    state, clearAllData, importBackup, saveSyncConfig, getSyncConfig
  } = useBudget();

  // Local Sync Settings form state
  const [syncUrl, setSyncUrl] = useState(() => getSyncConfig().url || '');
  const [syncKey, setSyncKey] = useState(() => getSyncConfig().anonKey || '');
  const [syncId, setSyncId] = useState(() => getSyncConfig().syncId || 'default');
  const [syncPass, setSyncPass] = useState(() => getSyncConfig().passphrase || '');

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

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 pb-12 select-none" id="settings-tab-view">
      {/* Guide section */}
      <div className={sectionHeadingClass} id="settings-sec-head-guide">
        Getting Started
      </div>

      <div className="bg-white p-3 overflow-hidden" id="settings-guide-panel">
        <button
          onClick={onOpenGuide}
          className={quietButtonClass}
          id="settings-open-guide-btn"
        >
          <BookOpen size={14} className="settings-button-icon" />
          Budgeting Guide
        </button>
      </div>

      {/* Cloud Sync setup */}
      <div className={`${sectionHeadingClass} mt-5`} id="settings-sec-head-sync">
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
            className={primaryButtonClass}
            id="settings-save-sync-btn"
          >
            <Save size={14} />
            Save Sync Settings
          </button>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handlePushCloud}
              disabled={isPushing}
              className={secondaryButtonClass}
              id="settings-push-sync-btn"
            >
              <Upload size={14} className={isPushing ? "animate-spin" : ""} />
              {isPushing ? 'Pushing...' : 'Push to Cloud'}
            </button>
            <button
              onClick={handlePullCloud}
              disabled={isPulling}
              className={secondaryButtonClass}
              id="settings-pull-sync-btn"
            >
              <Download size={14} className={isPulling ? "animate-spin" : ""} />
              {isPulling ? 'Pulling...' : 'Pull from Cloud'}
            </button>
          </div>
        </div>
      </div>

      {/* Backup and restore panel */}
      <div className={`${sectionHeadingClass} mt-5`} id="settings-sec-head-data">
        Local Data Backups
      </div>

      <div className="bg-white overflow-hidden p-3 space-y-2" id="settings-backups-panel">
        <button
          onClick={handleExportJSON}
          className={quietButtonClass}
          id="settings-export-json-btn"
        >
          <Upload size={14} className="settings-button-icon" />
          Export JSON Backup
        </button>

        <button
          onClick={handleImportClick}
          className={quietButtonClass}
          id="settings-import-json-btn"
        >
          <Download size={14} className="settings-button-icon" />
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
          className={quietButtonClass}
          id="settings-export-csv-btn"
        >
          <FileSpreadsheet size={14} className="settings-button-icon" />
          Export Transactions (CSV)
        </button>

        <button
          onClick={handleResetData}
          className={dangerButtonClass}
          id="settings-wipe-btn"
        >
          <Trash size={14} />
          Reset All Data
        </button>
      </div>

    </div>
  );
};
