import { INITIAL_SEED_STATE } from '../data/seedData';
import { SystemState } from '../types';

const STORAGE_KEY = 'acadledger_marks_system_v2';

/**
 * Storage Service Abstraction
 * Currently backed by browser localStorage with JSON Backup/Restore.
 * Designed with an explicit interface so Supabase/PostgreSQL adapters
 * can replace these methods without modifying UI or Context consumers.
 */
export interface IStorageService {
  loadState(): SystemState;
  saveState(state: SystemState): void;
  resetToSeed(): SystemState;
  validateBackupPayload(rawJson: string): { valid: boolean; state?: SystemState; error?: string };
}

class LocalStorageService implements IStorageService {
  loadState(): SystemState {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = structuredClone(INITIAL_SEED_STATE);
        this.saveState(seed);
        return seed;
      }
      const parsed = JSON.parse(raw) as SystemState;
      if (
        !parsed ||
        !Array.isArray(parsed.users) ||
        !Array.isArray(parsed.classes) ||
        !Array.isArray(parsed.subjects) ||
        !Array.isArray(parsed.students) ||
        !Array.isArray(parsed.assignments) ||
        !Array.isArray(parsed.marks)
      ) {
        const seed = structuredClone(INITIAL_SEED_STATE);
        this.saveState(seed);
        return seed;
      }
      return parsed;
    } catch {
      const seed = structuredClone(INITIAL_SEED_STATE);
      this.saveState(seed);
      return seed;
    }
  }

  saveState(state: SystemState): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota exceeded or restricted environment
    }
  }

  resetToSeed(): SystemState {
    const seed = structuredClone(INITIAL_SEED_STATE);
    this.saveState(seed);
    return seed;
  }

  validateBackupPayload(
    rawJson: string
  ): { valid: boolean; state?: SystemState; error?: string } {
    try {
      const parsed = JSON.parse(rawJson) as Partial<SystemState>;
      const requiredArrays: Array<keyof SystemState> = [
        'users',
        'classes',
        'subjects',
        'students',
        'assignments',
        'marks',
      ];
      for (const key of requiredArrays) {
        if (!Array.isArray(parsed[key])) {
          return {
            valid: false,
            error: `Invalid backup schema: missing or malformed "${key}" collection.`,
          };
        }
      }
      if (!parsed.academicYear || typeof parsed.academicYear !== 'string') {
        return {
          valid: false,
          error: 'Invalid backup schema: missing academicYear metadata.',
        };
      }
      return {
        valid: true,
        state: {
          version: parsed.version ?? '1.0.0',
          academicYear: parsed.academicYear,
          users: parsed.users!,
          classes: parsed.classes!,
          subjects: parsed.subjects!,
          students: parsed.students!,
          assignments: parsed.assignments!,
          marks: parsed.marks!,
          lastBackupAt: parsed.lastBackupAt,
        },
      };
    } catch {
      return {
        valid: false,
        error: 'The selected file is not valid JSON. Please upload a valid .json backup.',
      };
    }
  }
}

export const storageService: IStorageService = new LocalStorageService();

export function downloadBackupFile(state: SystemState): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const payload: SystemState = {
    ...state,
    lastBackupAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vvitu-portal-backup-${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return payload.lastBackupAt!;
}
