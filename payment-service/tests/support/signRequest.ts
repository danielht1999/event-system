import { createHmac } from 'node:crypto';

export function signRequest(secret: string, rawBody: string, timestamp: string = Date.now().toString()) {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return {
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  };
}