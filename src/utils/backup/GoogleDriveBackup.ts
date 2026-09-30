import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Logger } from '../Logger';

export interface GoogleDriveBackupConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId?: string;
}

export class GoogleDriveBackup {
  private drive: any;
  private logger: Logger;
  private folderId?: string;

  constructor(config: GoogleDriveBackupConfig) {
    const oauth2Client = new google.auth.OAuth2({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: 'http://localhost:3000',
    });

    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });

    this.drive = google.drive({
      version: 'v3',
      auth: oauth2Client,
    });

    this.folderId = config.folderId;
    this.logger = new Logger('backup');
  }

  /**
   * Backup the SQLite database to Google Drive
   */
  async backupDatabase(dbPath: string): Promise<{ filename: string; uploaded: boolean }> {
    try {
      const backupDir = process.env.BACKUP_DIR || './data/backups';
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `sqlite_backup_${timestamp}.sqlite3`;
      const backupPath = path.join(backupDir, filename);

      // Create backup directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        this.logger.info(`Created backup directory: ${backupDir}`);
      }

      // Copy the database file
      fs.copyFileSync(dbPath, backupPath);
      this.logger.info(`Database backup created: ${backupPath}`);

      // Upload to Google Drive
      const media = {
        body: fs.createReadStream(backupPath),
      };

      const resource: any = {
        name: filename,
        mimeType: 'application/x-sqlite3',
      };

      if (this.folderId) {
        resource.parents = [this.folderId];
      }

      await this.drive.files.create({
        resource,
        media,
      });

      this.logger.info(`Backup uploaded to Google Drive: ${filename}`);
      return { filename, uploaded: true };
    } catch (error) {
      this.logger.error(`Backup failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Download the latest backup from Google Drive
   */
  async downloadLatestBackup(backupPath: string): Promise<void> {
    try {
      const response = await this.drive.files.list({
        orderBy: 'modifiedTime desc',
        pageSize: 1,
        fields: 'files(id, name, mimeType)',
      });

      const files = response.data.files;
      if (!files || files.length === 0) {
        this.logger.info('No backups found in Google Drive');
        return;
      }

      const latestBackup = files[0];
      const downloadedFile = await this.drive.files.get(
        { fileId: latestBackup.id, alt: 'media' },
        { responseType: 'stream' }
      );

      const stream = fs.createWriteStream(backupPath);
      downloadedFile.data.pipe(stream);

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          this.logger.info(`Backup downloaded: ${backupPath}`);
          resolve();
        });
        stream.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      this.logger.error(`Download failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * List all backups stored in Google Drive
   */
  async listBackups(): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
    try {
      const response = await this.drive.files.list({
        orderBy: 'modifiedTime desc',
        pageSize: 10,
        fields: 'files(id, name, modifiedTime)',
      });

      return response.data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime,
      }));
    } catch (error) {
      this.logger.error(`List backups failed: ${String(error)}`);
      throw error;
    }
  }
}
