import Bottleneck from 'bottleneck';

export const zenodoLimiter = new Bottleneck({
  minTime: 60000 / 80, // 80 requests per minute = 750ms between requests
});

export const fieldSitesLimiter = new Bottleneck({
  minTime: 60000 / 80, // 80 requests per minute = 750ms between requests
});
