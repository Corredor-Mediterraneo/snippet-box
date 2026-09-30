import { join } from 'path';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
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

// App config
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

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

// Backup route (optional, requires Google Drive config)
app.post('/api/backup', async (_req: Request, res: Response) => {
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
