import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import path from 'path';
import { fileURLToPath } from 'url';

import { GeminiService } from './services/geminiService.js';
import { LongitudinalService } from './services/longitudinalService.js';
import { StorageService } from './services/storageService.js';
import { SAMPLE_SCENARIOS } from './data/sampleScenarios.js';
import { StructuredPatientRecord } from './types/clinical.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const upload = multer({ storage: multer.memoryStorage() });

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'MedLens Clinical Intelligence API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 2. Predefined Sample Scenarios
app.get('/api/scenarios', (req: Request, res: Response) => {
  res.json(SAMPLE_SCENARIOS);
});

// 3. Document Parsing (PDF / Text file upload)
app.post('/api/parse-document', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { mimetype, originalname, buffer } = req.file;

    if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
      try {
        const data = await pdfParse(buffer);
        return res.json({
          text: data.text,
          pages: data.numpages,
          filename: originalname,
          sourceType: 'PDF_PARSED'
        });
      } catch (pdfErr) {
        console.error('PDF parsing error:', pdfErr);
        return res.status(422).json({ error: 'Could not extract text from the PDF file' });
      }
    }

    // Text or markdown file
    if (mimetype.startsWith('text/') || originalname.match(/\.(txt|csv|tsv|md)$/i)) {
      const text = buffer.toString('utf-8');
      return res.json({
        text,
        filename: originalname,
        sourceType: 'TEXT_FILE'
      });
    }

    return res.status(400).json({
      error: 'Unsupported file format. Please upload a PDF or plain text medical report.'
    });
  } catch (error: any) {
    console.error('Error in parse-document:', error);
    res.status(500).json({ error: error.message || 'Internal server error during document parsing' });
  }
});

// 4. Clinical Extraction & Intelligence Pipeline
app.post('/api/extract', async (req: Request, res: Response) => {
  try {
    const { intake, currentReportText, previousReportText, apiKey } = req.body;

    if (!currentReportText && (!intake || !intake.name)) {
      return res.status(400).json({
        error: 'Please provide patient intake details or a medical report to process.'
      });
    }

    const safeIntake = intake || {
      name: 'Unspecified Patient',
      age: '',
      sex: 'Other',
      symptoms: [],
      conditions: [],
      allergies: [],
      medications: [],
      notes: '',
      source: 'PATIENT_INTAKE'
    };

    const structuredRecord = await GeminiService.processMedicalIntelligence(
      safeIntake,
      currentReportText || '',
      previousReportText || undefined,
      apiKey
    );

    // Save to persistent local storage automatically
    StorageService.saveRecord(structuredRecord);

    res.json(structuredRecord);
  } catch (error: any) {
    console.error('Error in /api/extract:', error);
    res.status(500).json({ error: error.message || 'Error processing clinical intelligence' });
  }
});

// 5. Longitudinal Comparison
app.post('/api/compare', (req: Request, res: Response) => {
  try {
    const { currentParams, previousParams } = req.body;
    if (!Array.isArray(currentParams) || !Array.isArray(previousParams)) {
      return res.status(400).json({ error: 'Both currentParams and previousParams must be arrays' });
    }
    const comparison = LongitudinalService.compareReports(currentParams, previousParams);
    res.json(comparison);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error comparing reports' });
  }
});

// 6. Persistent Record Management (CRUD)
app.get('/api/records', (req: Request, res: Response) => {
  try {
    const records = StorageService.getAllRecords();
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve records' });
  }
});

app.get('/api/records/:id', (req: Request, res: Response) => {
  try {
    const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const record = StorageService.getRecordById(recordId);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve record' });
  }
});

app.post('/api/records', (req: Request, res: Response) => {
  try {
    const record: StructuredPatientRecord = req.body;
    if (!record || !record.id) {
      return res.status(400).json({ error: 'Valid record with id is required' });
    }
    const saved = StorageService.saveRecord(record);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save record' });
  }
});

app.delete('/api/records/:id', (req: Request, res: Response) => {
  try {
    const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = StorageService.deleteRecord(recordId);
    if (!success) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Serve frontend static build in production
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexHtml = path.join(clientDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.send('MedLens Backend API is running. Start the client with "npm run dev:client".');
    }
  });
});

app.listen(PORT, () => {
  console.log(`MedLens API server listening on port ${PORT}`);
});
