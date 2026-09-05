import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { GeminiService } from './services/geminiService.js';
import { LongitudinalService } from './services/longitudinalService.js';
import { StorageService } from './services/storageService.js';
import { SAMPLE_SCENARIOS } from './data/sampleScenarios.js';
import { StructuredPatientRecord } from './types/clinical.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const upload = multer({ storage: multer.memoryStorage() });

// Router holding all MedLens clinical endpoints
const apiRouter = Router();

// 1. Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'MedLens Clinical Intelligence API',
    platform: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js Express',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 2. Predefined Sample Scenarios
apiRouter.get('/scenarios', (req: Request, res: Response) => {
  res.json(SAMPLE_SCENARIOS);
});

// 3. Document Parsing (PDF / Text file upload)
apiRouter.post('/parse-document', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { mimetype, originalname, buffer } = req.file;

    if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
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
apiRouter.post('/extract', async (req: Request, res: Response) => {
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

    // Save to persistent storage automatically
    StorageService.saveRecord(structuredRecord);

    res.json(structuredRecord);
  } catch (error: any) {
    console.error('Error in /extract:', error);
    res.status(500).json({ error: error.message || 'Error processing clinical intelligence' });
  }
});

// 5. Longitudinal Comparison
apiRouter.post('/compare', (req: Request, res: Response) => {
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
apiRouter.get('/records', (req: Request, res: Response) => {
  try {
    const records = StorageService.getAllRecords();
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve records' });
  }
});

apiRouter.get('/records/:id', (req: Request, res: Response) => {
  try {
    const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const record = StorageService.getRecordById(recordId);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve record' });
  }
});

apiRouter.post('/records', (req: Request, res: Response) => {
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

apiRouter.delete('/records/:id', (req: Request, res: Response) => {
  try {
    const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = StorageService.deleteRecord(recordId);
    if (!success) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Mount on BOTH '/api' and '/' to ensure 100% compatibility with Vercel rewrites and local dev
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Serve frontend static build in local standalone production mode (non-Vercel)
if (!process.env.VERCEL) {
  const rootDist = path.resolve(__dirname, '../../dist');
  const clientDist = path.resolve(__dirname, '../../client/dist');
  const staticDist = fs.existsSync(rootDist) ? rootDist : clientDist;

  app.use(express.static(staticDist));
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    const indexHtml = path.join(staticDist, 'index.html');
    res.sendFile(indexHtml, (err) => {
      if (err) {
        res.send('MedLens API is running. Start the frontend with "npm run dev:client".');
      }
    });
  });
}

export default app;
