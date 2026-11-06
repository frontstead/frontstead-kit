import { isEmailConfigured } from 'email';
import logger from '../utils/logger.js';
import { dispatchInquiryDeliveries } from './inquiryDeliveryService.js';

// Sends queued inquiry alerts (the InquiryDelivery outbox) from inside the API
// process, so a deployment needs no external cron to tell the portal owner
// about a new lead. POST /api/cron/inquiry-deliveries still works for anyone
// who prefers an external trigger; claims are atomic, so both can run.
//
//   INQUIRY_DELIVERY_INTERVAL_SECONDS  default 60; 0 turns the scheduler off
//
// It only starts when an email provider is configured. Without one, every
// attempt would fail and dead-letter the alert, so the rows stay queued and
// go out once a provider is set.

export const DEFAULT_INTERVAL_SECONDS = 60;

export function parseIntervalSeconds(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return DEFAULT_INTERVAL_SECONDS;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error(`INQUIRY_DELIVERY_INTERVAL_SECONDS must be a number of seconds, or 0 to turn it off (got '${value}')`);
  }
  return seconds;
}

type SchedulerOptions = {
  intervalSeconds?: number;
  emailConfigured?: boolean;
  dispatch?: () => Promise<{ delivered: number; retried: number; deadLettered: number }>;
};

export function startInquiryDeliveryScheduler(options: SchedulerOptions = {}): (() => void) | null {
  const intervalSeconds = options.intervalSeconds ?? parseIntervalSeconds(process.env.INQUIRY_DELIVERY_INTERVAL_SECONDS);
  const emailConfigured = options.emailConfigured ?? isEmailConfigured();
  const dispatch = options.dispatch ?? (() => dispatchInquiryDeliveries());

  if (intervalSeconds === 0) {
    logger.info('Inquiry alerts: scheduler off (INQUIRY_DELIVERY_INTERVAL_SECONDS=0)');
    return null;
  }
  if (!emailConfigured) {
    logger.info('Inquiry alerts: no email provider (RESEND_API_KEY), so alerts stay queued until one is set');
    return null;
  }

  let running = false;
  const tick = async () => {
    // A slow provider must not stack runs on top of each other.
    if (running) return;
    running = true;
    try {
      const result = await dispatch();
      if (result.delivered || result.retried || result.deadLettered) {
        logger.info(`Inquiry alerts: ${result.delivered} sent, ${result.retried} retrying, ${result.deadLettered} dead-lettered`);
      }
    } catch (error) {
      logger.error('Inquiry alerts: dispatch failed:', error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(tick, intervalSeconds * 1000);
  timer.unref();
  void tick();
  logger.info(`Inquiry alerts: sending queued alerts every ${intervalSeconds}s`);
  return () => clearInterval(timer);
}
