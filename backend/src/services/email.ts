import { Resend } from 'resend';
import { env } from '../config/env';

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) {
    if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
};
const FROM_EMAIL = 'hi@mapleleafmovingco.com'; // Adjust as needed if domain verified

export async function sendCustomerConfirmation(orderId: string, email: string, name: string, date: string, totalCents: number) {
  const total = (totalCents / 100).toFixed(2);
  await getResend().emails.send({
    from: `Maple Leaf Moving Co <${FROM_EMAIL}>`,
    to: email,
    subject: `Booking Confirmed: Your Move on ${date}`,
    html: `
      <h1>Thanks for booking with us, ${name}!</h1>
      <p>Your move is confirmed for <strong>${date}</strong>.</p>
      <p>Total Paid: $${total} CAD</p>
      <p>If you have any questions, reply to this email or call us.</p>
      <p>- The Maple Leaf Moving Team</p>
    `
  });
}

export async function sendOwnerAlert(orderId: string, name: string, email: string, phone: string, date: string, totalCents: number, fromAddr: string, toAddr: string) {
  const total = (totalCents / 100).toFixed(2);
  await getResend().emails.send({
    from: `Maple Leaf Moving Alerts <${FROM_EMAIL}>`,
    to: 'hi@mapleleafmovingco.com', // Owner's email
    subject: `🚨 New Booking: $${total} on ${date}`,
    html: `
      <h2>New Booking Confirmed</h2>
      <ul>
        <li><strong>Order ID:</strong> ${orderId}</li>
        <li><strong>Customer:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>From:</strong> ${fromAddr}</li>
        <li><strong>To:</strong> ${toAddr}</li>
        <li><strong>Total:</strong> $${total} CAD</li>
      </ul>
    `
  });
}
