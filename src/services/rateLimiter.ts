export class RateLimiter {
  rPerMinute: number;
  delayMs: number;
  lastRequestTimestamp: number;
  constructor(rPerMinute: number) {
    const minuteToMs = 60000;
    this.rPerMinute = rPerMinute;
    this.delayMs = minuteToMs / rPerMinute;
    this.lastRequestTimestamp = 0;
  }

  // Resolves once the request can be done
  async waitForRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTimestamp;
    const timeToWait = this.delayMs - timeSinceLastRequest;

    if (timeToWait > 0) {
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
    }

    this.lastRequestTimestamp = now + (timeToWait > 0 ? timeToWait : 0);
  }
}
