import { promises as fs } from 'fs';

type LogLevel = 'info' | 'warn' | 'error';

interface LogMessage {
  timestamp: Date;
  level: LogLevel;
  message: string;
}

const logFilePath: string = process.env.LOG || 'harvester.log';

export const log = (level: LogLevel, message: string) => {
  const logEntry: LogMessage = { timestamp: new Date(), level, message };
  console.log(`[${logEntry.timestamp.toISOString()}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`);
  fs.appendFile(
    logFilePath,
    `[${logEntry.timestamp.toISOString()}] [${logEntry.level.toUpperCase()}] ${logEntry.message}\n`,
  ).catch(console.error);
};
