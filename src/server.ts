import { join } from 'path';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Logger } from './utils';
import { connectDB } from './db';
import { errorHandler } from './middleware';
import { GoogleDriveBackup } from './utils/backup';
import { startMcpServer } from './mcp';

// Routers
import { snippetRouter } from './routes/snippets';
import { associateModels } from './db/associateModels';

// Env config
dotenv.config({ path: './src/config/.env' });

const app = express();
const logger = new Logger('server');
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5000', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// App config
app.use(express.json({ limit: '1mb' }));
app.use(express.static(join(__dirname, '../public')));

// Simple rate limiting
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW });
    return next();
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }

  next();
});

// Serve client code
app.get(/^\/(?!api)/, (_req: Request, res: Response) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

// Routes
app.use('/api/snippets', snippetRouter);

// Error handler
app.use(errorHandler);

// Google Drive Backup (optional)
let googleDriveBackup: GoogleDriveBackup | null = null;
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_REFRESH_TOKEN
) {
  googleDriveBackup = new GoogleDriveBackup({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    folderId: process.env.GOOGLE_FOLDER_ID
  });
  logger.info('Google Drive Backup configured');
}

// Backup authentication middleware
const requireBackupAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-backup-api-key'] as string;
  const configuredKey = process.env.BACKUP_API_KEY;

  if (!configuredKey) {
    res.status(503).json({ error: 'Backup API key not configured' });
    return;
  }

  if (!apiKey || apiKey !== configuredKey) {
    res.status(401).json({ error: 'Unauthorized: invalid or missing API key' });
    return;
  }

  next();
};

// Backup status endpoint (public, returns config status)
app.get('/api/backup/status', (_req: Request, res: Response) => {
  const configured = !!googleDriveBackup;
  const apiKeyConfigured = !!process.env.BACKUP_API_KEY;
  res.json({
    configured,
    apiKeyConfigured,
    ready: configured && apiKeyConfigured
  });
});

// Backup route (optional, requires Google Drive config + API key)
app.post('/api/backup', requireBackupAuth, async (_req: Request, res: Response) => {
  if (!googleDriveBackup) {
    return res.status(503).json({ error: 'Google Drive Backup not configured' });
  }

  try {
    const dbPath = process.env.DATABASE_PATH || './data/snippets.sqlite3';
    const result = await googleDriveBackup.backupDatabase(dbPath);
    return res.json({ message: 'Backup successful', filename: result.filename });
  } catch (error: any) {
    return res.status(500).json({ error: 'Backup failed', details: error.message });
  }
});

// List backups route
app.get('/api/backup/list', requireBackupAuth, async (_req: Request, res: Response) => {
  if (!googleDriveBackup) {
    return res.status(503).json({ error: 'Google Drive Backup not configured' });
  }

  try {
    const backups = await googleDriveBackup.listBackups();
    return res.json({ backups });
  } catch (error: any) {
    return res.status(500).json({ error: 'List backups failed', details: error.message });
  }
});

// Restore latest backup route
app.post('/api/backup/restore', requireBackupAuth, async (_req: Request, res: Response) => {
  if (!googleDriveBackup) {
    return res.status(503).json({ error: 'Google Drive Backup not configured' });
  }

  try {
    const dbPath = process.env.DATABASE_PATH || './data/snippets.sqlite3';
    const backupPath = dbPath + '.restore.tmp';
    await googleDriveBackup.downloadLatestBackup(backupPath);
    
    // Replace the database file
    const fs = await import('fs');
    fs.renameSync(backupPath, dbPath);
    
    return res.json({ message: 'Restore successful' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Restore failed', details: error.message });
  }
});

(async () => {
  await connectDB();
  await associateModels();

  app.listen(PORT, () => {
    logger.info(
      `Server is working on port ${PORT} in ${process.env.NODE_ENV} mode`
    );
  });

  // Start MCP server in parallel
  startMcpServer();
})();
