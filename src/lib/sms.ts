const ARKESEL_API_KEY = process.env.ARKESEL_API_KEY || '';
const SENDER_ID = 'SafeTrade';

/**
 * Send an SMS via Arkesel API (Ghana)
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!ARKESEL_API_KEY) {
    console.log(`[SMS Mock] To: ${to}, Message: ${message}`);
    return true;
  }

  try {
    const res = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'api-key': ARKESEL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: SENDER_ID,
        message,
        recipients: [to],
      }),
    });

    const data = await res.json();
    console.log('[SMS] Arkesel response:', JSON.stringify(data));
    return res.ok;
  } catch (err) {
    console.error('[SMS] Arkesel send failed:', err);
    return false;
  }
}

/**
 * Send an OTP code via SMS
 */
export async function sendOTP(phone: string, code: string): Promise<boolean> {
  const message = `Your SafeTrade verification code is: ${code}. It expires in 10 minutes. Do not share this code with anyone.`;
  return sendSMS(phone, message);
}

/**
 * Send auto-release reminder to buyer
 */
export async function sendAutoReleaseReminder(
  phone: string,
  confirmLink: string,
  hoursLeft: number
): Promise<boolean> {
  const message = `Your SafeTrade order auto-releases in ${hoursLeft} hours. Received it? Confirm delivery at ${confirmLink}. Problem? Raise a dispute now before the window closes.`;
  return sendSMS(phone, message);
}
