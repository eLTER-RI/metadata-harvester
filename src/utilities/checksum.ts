import { createHash } from 'crypto';

export function calculateChecksum(data: any): string {
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  return createHash('md5').update(stringData).digest('hex');
}
