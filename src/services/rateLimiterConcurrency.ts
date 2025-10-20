import Bottleneck from 'bottleneck';

// How long to wait after launching a job before launching another one.

export const b2shareLimiter = new Bottleneck({
  minTime: 10000 / 80, // 60 requests per minute = 750ms between requests
});

export const zenodoLimiter = new Bottleneck({
  minTime: 60000 / 80, // 80 requests per minute = 750ms between requests
});

export const fieldSitesLimiter = new Bottleneck({
  minTime: 60000 / 80, // 80 requests per minute = 750ms between requests
});

export const deimsLimiter = new Bottleneck({
  minTime: 60000 / 80, // 80 requests per minute = 750ms between requests
});

export const darLimiter = new Bottleneck({
  minTime: 60000 / 60, // 1000 ms between requests (1 per second)
});
