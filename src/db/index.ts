import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import { Logger } from '../utils';
import { readdirSync } from 'fs';
import { join } from 'path';

const logger = new Logger('db');

// DB config
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'data/db.sqlite3',
  logging: false
});

// Helper function to dynamically require migration files
function getMigrations() {
  // Inside the Docker container, __dirname is /app/build/db/
  // The compiled migrations are at /app/build/db/migrations/*.js
  // From the compiled code perspective (build/db/), the migrations are at ./migrations
  const migrationDir = join(__dirname, 'migrations');
  const migrations: any[] = [];
  
  const files = readdirSync(migrationDir)
    .filter(f => f.endsWith('.js') && !f.endsWith('.js.map') && !f.endsWith('.d.ts'))
    .sort();
  
  for (const file of files) {
    const path = join(migrationDir, file);
    const migration = require(path);
    migrations.push({
      name: file.replace('.js', ''),
      up: migration.up,
      down: migration.down
    });
  }
  
  return migrations;
}

// Migrations config - pass queryInterface as context for Umzug v3
const queryInterface = sequelize.getQueryInterface();
const umzug = new Umzug({
  migrations: getMigrations(),
  storage: new SequelizeStorage({ sequelize }),
  context: queryInterface,
  logger: {
    info: (message: any) => logger.info(typeof message === 'object' && message !== null ? JSON.stringify(message) : String(message)),
    warn: (message: any) => logger.warn(typeof message === 'object' && message !== null ? JSON.stringify(message) : String(message)),
    error: (message: any) => logger.error(typeof message === 'object' && message !== null ? JSON.stringify(message) : String(message)),
    debug: (message: any) => logger.debug(typeof message === 'object' && message !== null ? JSON.stringify(message) : String(message))
  }
});

export const connectDB = async () => {
  const isDev = process.env.NODE_ENV == 'development';

  try {
    // Create & connect db
    await sequelize.authenticate();
    logger.info(`Database connected`);

    // Check migrations
    const pendingMigrations = await umzug.pending();

    if (pendingMigrations.length > 0) {
      logger.info(`Found pending migrations. Executing...`);

      if (isDev) {
        pendingMigrations.forEach((migration: any) =>
          logger.info(`Executing ${migration.name} migration`)
        );
      }
    }

    await umzug.up();
    logger.info(`Migrations completed successfully`);
  } catch (err) {
    logger.error(`Database connection error`);
    logger.error(`${err}`);

    if (isDev) {
      console.log(err);
    }

    process.exit(1);
  }
};
