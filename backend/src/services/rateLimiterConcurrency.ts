import Bottleneck from 'bottleneck';

function createRateLimiter(requestsPerMinute: number): Bottleneck {
  const minTimeMs = 60000 / requestsPerMinute;
  return new Bottleneck({
    minTime: minTimeMs,
  });
}

export const b2shareLimiter = createRateLimiter(80); // 80 requests per minute = 750ms between requests

export const b2shareJuelichLimiter = createRateLimiter(80); // 80 requests per minute = 1500ms between requests

export const zenodoLimiter = createRateLimiter(80); // 80 requests per minute = 750ms between requests

export const fieldSitesLimiter = createRateLimiter(80); // 80 requests per minute = 750ms between requests

export const deimsLimiter = createRateLimiter(80); // 80 requests per minute = 750ms between requests

export const darLimiter = createRateLimiter(200); // 200 requests per minute = 1000ms between requests (1 per second)
