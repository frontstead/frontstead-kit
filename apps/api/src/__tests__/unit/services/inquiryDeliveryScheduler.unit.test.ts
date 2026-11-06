import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('email', () => ({ isEmailConfigured: vi.fn(() => false) }));
vi.mock('../../../services/inquiryDeliveryService.js', () => ({ dispatchInquiryDeliveries: vi.fn() }));
vi.mock('../../../utils/logger.js', () => ({ default: { info: vi.fn(), error: vi.fn() } }));
const { parseIntervalSeconds, startInquiryDeliveryScheduler } = await import('../../../services/inquiryDeliveryScheduler.js');

const idle = { delivered: 0, retried: 0, deadLettered: 0 };

describe('parseIntervalSeconds', () => {
  it('defaults to 60 seconds and accepts 0 to turn it off', () => {
    expect(parseIntervalSeconds(undefined)).toBe(60);
    expect(parseIntervalSeconds('')).toBe(60);
    expect(parseIntervalSeconds('0')).toBe(0);
    expect(parseIntervalSeconds('300')).toBe(300);
  });

  it('rejects values that are not a number of seconds', () => {
    expect(() => parseIntervalSeconds('soon')).toThrow(/INQUIRY_DELIVERY_INTERVAL_SECONDS/);
    expect(() => parseIntervalSeconds('-5')).toThrow(/INQUIRY_DELIVERY_INTERVAL_SECONDS/);
  });
});

describe('startInquiryDeliveryScheduler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not start without an email provider, so alerts stay queued', () => {
    const dispatch = vi.fn().mockResolvedValue(idle);
    expect(startInquiryDeliveryScheduler({ intervalSeconds: 60, emailConfigured: false, dispatch })).toBeNull();
    vi.advanceTimersByTime(120_000);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not start when the interval is 0', () => {
    const dispatch = vi.fn().mockResolvedValue(idle);
    expect(startInquiryDeliveryScheduler({ intervalSeconds: 0, emailConfigured: true, dispatch })).toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatches at start and then on every interval', async () => {
    const dispatch = vi.fn().mockResolvedValue(idle);
    const stop = startInquiryDeliveryScheduler({ intervalSeconds: 60, emailConfigured: true, dispatch });
    await vi.advanceTimersByTimeAsync(0);
    expect(dispatch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(dispatch).toHaveBeenCalledTimes(3);
    stop?.();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(dispatch).toHaveBeenCalledTimes(3);
  });

  it('skips a tick while the previous dispatch is still running', async () => {
    let finish: (value: typeof idle) => void = () => {};
    const dispatch = vi.fn(() => new Promise<typeof idle>((resolve) => { finish = resolve; }));
    const stop = startInquiryDeliveryScheduler({ intervalSeconds: 1, emailConfigured: true, dispatch });
    await vi.advanceTimersByTimeAsync(5_000);
    expect(dispatch).toHaveBeenCalledTimes(1);
    finish(idle);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(dispatch).toHaveBeenCalledTimes(2);
    stop?.();
  });

  it('keeps running after a dispatch error', async () => {
    const dispatch = vi.fn().mockRejectedValueOnce(new Error('database down')).mockResolvedValue(idle);
    const stop = startInquiryDeliveryScheduler({ intervalSeconds: 60, emailConfigured: true, dispatch });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(dispatch).toHaveBeenCalledTimes(2);
    stop?.();
  });
});
