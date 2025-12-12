import { promises as fs } from 'fs';
import * as path from 'path';

type LogLevel = 'info' | 'warn' | 'error';

interface LogMessage {
  timestamp: Date;
  level: LogLevel;
  message: string;
}

const logFilePath: string = process.env.LOG || 'harvester.log';

export const log = async (level: LogLevel, message: string) => {
  const logEntry: LogMessage = { timestamp: new Date(), level, message };
  const logString = `[${logEntry.timestamp.toISOString()}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`;
  console.log(logString);
  try {
    await fs.mkdir(path.dirname(logFilePath), { recursive: true });
    await fs.appendFile(logFilePath, `${logString}\n`);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};
