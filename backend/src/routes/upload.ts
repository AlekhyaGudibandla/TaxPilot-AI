import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { prisma } from '../index';
import { processDocumentAsync } from '../services/documentProcessor';

const router = Router();

// Setup Multer storage
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const clientId = req.query.client_id as string | undefined;
    const documents = await prisma.fileUpload.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { client: true }
    });
    res.json({ documents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.array('files'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    let clientId = req.query.client_id as string | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (!clientId) {
        // Fallback to first client for MVP if none selected
        const firstClient = await prisma.client.findFirst();
        if (firstClient) {
          clientId = firstClient.id;
        } else {
          return res.status(400).json({ error: 'client_id query parameter is required and no default clients exist' });
        }
    }

    // Check if client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
        return res.status(400).json({ error: 'Client not found' });
    }

    const savedPaths: string[] = [];
    const dbRecords = [];

    // Save initial placeholder records
    for (const file of files) {
      const record = await prisma.fileUpload.create({
        data: {
          clientId,
          filename: file.originalname,
          storagePath: file.path,
          status: 'pending'
        }
      });
      savedPaths.push(file.path);
      dbRecords.push(record);
      
      // Kick off async processing (In MVP we fire-and-forget, in prod use BullMQ)
      processDocumentAsync(record.id, file.path, clientId).catch((err: any) => {
        console.error(`Error processing file ${record.id}:`, err);
      });
    }

    res.json({
      status: 'uploaded',
      files_count: files.length,
      file_paths: savedPaths,
      documents: dbRecords
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
