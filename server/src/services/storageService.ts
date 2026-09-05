import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { StructuredPatientRecord } from '../types/clinical.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');

export class StorageService {
  private static ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(RECORDS_FILE)) {
      fs.writeFileSync(RECORDS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  }

  public static getAllRecords(): StructuredPatientRecord[] {
    try {
      this.ensureDataDir();
      const content = fs.readFileSync(RECORDS_FILE, 'utf8');
      return JSON.parse(content) as StructuredPatientRecord[];
    } catch (err) {
      console.error('Error reading records:', err);
      return [];
    }
  }

  public static getRecordById(id: string): StructuredPatientRecord | undefined {
    const records = this.getAllRecords();
    return records.find(r => r.id === id);
  }

  public static saveRecord(record: StructuredPatientRecord): StructuredPatientRecord {
    this.ensureDataDir();
    const records = this.getAllRecords();
    const index = records.findIndex(r => r.id === record.id);

    if (index >= 0) {
      records[index] = { ...record, updatedAt: new Date().toISOString() };
    } else {
      records.unshift(record);
    }

    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), 'utf8');
    return record;
  }

  public static deleteRecord(id: string): boolean {
    this.ensureDataDir();
    const records = this.getAllRecords();
    const filtered = records.filter(r => r.id !== id);
    if (filtered.length !== records.length) {
      fs.writeFileSync(RECORDS_FILE, JSON.stringify(filtered, null, 2), 'utf8');
      return true;
    }
    return false;
  }
}
