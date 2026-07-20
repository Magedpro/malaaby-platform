import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:Magedprooo8@gmail.com';

let initialized = false;

function initWebPush() {
  if (initialized) return;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys missing from environment variables. Browser push notifications disabled.');
    return;
  }
  try {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    initialized = true;
    console.log('[Push] Web Push initialized successfully.');
  } catch (err) {
    console.error('[Push] Failed to initialize VAPID:', err);
  }
}

export function getPublicKey(): string {
  return VAPID_PUBLIC_KEY || '';
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string
): Promise<{ success: boolean; expired?: boolean }> {
  initWebPush();

  if (!initialized) {
    console.warn('[Push] Skipping push notification — not initialized.');
    return { success: false };
  }

  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: subscription.keys },
      payload
    );
    return { success: true };
  } catch (error: any) {
    console.error('[Push] sendNotification error:', error?.statusCode, error?.body);
    // 410 Gone = subscription expired/unsubscribed, 404 = subscription not found
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      return { success: false, expired: true };
    }
    return { success: false };
  }
}
