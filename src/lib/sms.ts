const MNOTIFY_API_KEY = process.env.MNOTIFY_API_KEY || 'VZPCg1Ih2pxfbgCCrZsl5QJl3';
const SENDER_ID = 'mNotify'; // Default mNotify sender ID as per docs, or user can register a new one

/**
 * Send an SMS via mNotify API (Ghana)
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!MNOTIFY_API_KEY) {
    console.log(`[SMS Mock] To: ${to}, Message: ${message}`);
    return true;
  }

  try {
    const res = await fetch(`https://api.mnotify.com/api/sms/quick?key=${MNOTIFY_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: [to],
        sender: SENDER_ID,
        message: message,
        is_schedule: false,
        schedule_date: ''
      }),
    });

    const data = await res.json();
    console.log('[SMS] mNotify response:', JSON.stringify(data));
    
    // mNotify returns status: "success" and code: "2000" on success
    return data.status === 'success' && data.code === "2000";
  } catch (err) {
    console.error('[SMS] mNotify send failed:', err);
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
