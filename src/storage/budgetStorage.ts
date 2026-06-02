/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dexie, { type Table } from 'dexie';
import type { AppState } from '../types';

const LEGACY_STORAGE_KEY = 'amplop_v3_react';
const DB_NAME = 'amplop_local_db';
const APP_STATE_ID = 'main';

interface AppStateRecord {
  id: string;
  state: AppState;
  updatedAt: string;
}

class AmplopDatabase extends Dexie {
  appState!: Table<AppStateRecord, string>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      appState: 'id'
    });
  }
}

const db = new AmplopDatabase();

const loadLegacyLocalStorageState = (): AppState | null => {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error loading legacy localStorage budget state:', error);
    return null;
  }
};

export const loadPersistedState = async (): Promise<AppState | null> => {
  try {
    const record = await db.appState.get(APP_STATE_ID);
    if (record?.state) return record.state;

    const legacyState = loadLegacyLocalStorageState();
    if (legacyState) {
      await savePersistedState(legacyState);
      return legacyState;
    }
  } catch (error) {
    console.error('Error loading budget state from IndexedDB:', error);
    return loadLegacyLocalStorageState();
  }

  return null;
};

export const savePersistedState = async (state: AppState): Promise<void> => {
  try {
    await db.appState.put({
      id: APP_STATE_ID,
      state,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving budget state to IndexedDB:', error);
  }
};

export const clearPersistedState = async (): Promise<void> => {
  try {
    await db.appState.delete(APP_STATE_ID);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing persisted budget state:', error);
  }
};
