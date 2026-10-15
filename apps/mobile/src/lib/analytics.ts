import { ANALYTICS_SCHEMA_VERSION, type ClientAnalyticsEventName } from '@merak/contracts';
import { api } from './api';
import { newUuid } from './uuid';

type Props = Record<string, string | number | boolean>;
const queue: Array<{ eventId: string; schemaVersion: 1; eventName: ClientAnalyticsEventName; eventTime: string; contentItemId?: string; quizSessionId?: string; props?: Props }> = [];
let flushing = false;

/** Fire-and-forget client events; batched, de-duplicated server side by eventId. */
export function track(eventName: ClientAnalyticsEventName, ctx: { contentItemId?: string; quizSessionId?: string; props?: Props } = {}): void {
  queue.push({ eventId: newUuid(), schemaVersion: ANALYTICS_SCHEMA_VERSION, eventName, eventTime: new Date().toISOString(), ...ctx });
  void flush();
}

async function flush(): Promise<void> {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const batch = queue.splice(0, 50);
  try {
    await api('POST', '/events', { events: batch });
  } catch {
    queue.unshift(...batch.slice(0, 50)); // retry later
  } finally {
    flushing = false;
  }
}
