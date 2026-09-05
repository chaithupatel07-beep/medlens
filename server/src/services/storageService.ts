import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { StructuredPatientRecord } from '../types/clinical.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel serverless functions, only /tmp is writable
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp' : path.resolve(__dirname, '../../data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');

// In-memory fallback cache for serverless environments
let memoryRecords: StructuredPatientRecord[] = [];

export class StorageService {
  private static ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(RECORDS_FILE)) {
        fs.writeFileSync(RECORDS_FILE, JSON.stringify([], null, 2), 'utf8');
      }
    } catch (err) {
      // Ephemeral environments or permission limits fall back to in-memory store
      console.warn('Storage directory initialization notice:', (err as Error).message);
    }
  }

  public static getAllRecords(): StructuredPatientRecord[] {
    try {
      this.ensureDataDir();
      if (fs.existsSync(RECORDS_FILE)) {
        const content = fs.readFileSync(RECORDS_FILE, 'utf8');
        const parsed = JSON.parse(content) as StructuredPatientRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryRecords = parsed;
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Reading file records fallback to memory store:', (err as Error).message);
    }
    return memoryRecords;
  }

  public static getRecordById(id: string): StructuredPatientRecord | undefined {
    const records = this.getAllRecords();
    return records.find(r => r.id === id);
  }

  public static saveRecord(record: StructuredPatientRecord): StructuredPatientRecord {
    const records = this.getAllRecords();
    const index = records.findIndex(r => r.id === record.id);

    if (index >= 0) {
      records[index] = { ...record, updatedAt: new Date().toISOString() };
    } else {
      records.unshift(record);
    }

    memoryRecords = records;

    try {
      this.ensureDataDir();
      fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), 'utf8');
    } catch (err) {
      console.warn('Saving file records fallback to memory store:', (err as Error).message);
    }

    return record;
  }

  public static deleteRecord(id: string): boolean {
    const records = this.getAllRecords();
    const filtered = records.filter(r => r.id !== id);
    if (filtered.length !== records.length) {
      memoryRecords = filtered;
      try {
        this.ensureDataDir();
        fs.writeFileSync(RECORDS_FILE, JSON.stringify(filtered, null, 2), 'utf8');
      } catch (err) {
        console.warn('Deleting file records fallback to memory store:', (err as Error).message);
      }
      return true;
    }
    return false;
  }
}
