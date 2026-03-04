const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = 'SafeTrade Ghana <noreply@safetrade.app>';
const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS || '4000');

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend API error (${res.status}): ${errBody}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Email send failed:', error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendPaymentConfirmation(
  buyerEmail: string,
  buyerName: string,
  itemName: string,
  amount: number,
  confirmationToken: string
) {
  const confirmUrl = `${APP_URL}/confirm/${confirmationToken}`;
  return sendEmail(
    buyerEmail,
    `Payment Confirmed — ${itemName}`,
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0;">[SECURE] SafeTrade Ghana</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
        <h2>Payment Confirmed!</h2>
        <p>Hi ${buyerName},</p>
        <p>Your payment of <strong>GHS ${amount.toFixed(2)}</strong> for <strong>${itemName}</strong> has been secured in escrow.</p>
        <p>The vendor has been notified to fulfill your order. <strong>Smart Release Protection</strong> keeps your funds locked until delivery is confirmed.</p>
        <p>When you receive your item, click the button below to confirm delivery:</p>
        <a href="${confirmUrl}" style="display: inline-block; background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Confirm Delivery</a>
        <p style="color: #6b7280; font-size: 14px;">If you encounter any issues, use the link above to report a problem.</p>
      </div>
    </div>
    `
  );
}

export async function sendVendorNotification(
  vendorEmail: string,
  vendorName: string,
  itemName: string,
  amount: number,
  buyerName: string
) {
  return sendEmail(
    vendorEmail,
    `💰 GHS ${amount.toFixed(2)} Secured — Fulfill Your Order`,
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0;">[SECURE] SafeTrade Ghana</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
        <h2>New Order — Funds Secured! 🎉</h2>
        <p>Hi ${vendorName},</p>
        <p><strong>${buyerName}</strong> has paid <strong>GHS ${amount.toFixed(2)}</strong> for <strong>${itemName}</strong>.</p>
        <p>The funds are now locked in escrow. Please fulfill this order and mark it as shipped in your dashboard.</p>
        <p>Once the buyer confirms receipt, funds will be released to your MoMo number.</p>
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Go to Dashboard</a>
      </div>
    </div>
    `
  );
}

export async function sendDisputeAlert(
  email: string,
  name: string,
  itemName: string,
  reason: string,
  isVendor: boolean
) {
  return sendEmail(
    email,
    `⚠️ Dispute Raised — ${itemName}`,
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0;">⚠️ SafeTrade Ghana</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
        <h2>Dispute Filed</h2>
        <p>Hi ${name},</p>
        <p>A dispute has been raised for <strong>${itemName}</strong>.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>${isVendor ? 'The buyer has reported an issue with the transaction.' : 'Your dispute has been submitted and our team will review it.'}</p>
        <p>Our team will review this dispute and reach a resolution within 48 hours.</p>
      </div>
    </div>
    `
  );
}
