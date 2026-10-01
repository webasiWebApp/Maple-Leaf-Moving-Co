import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { validate } from '../middleware/validate';
import { env } from '../config/env';
import { supabase } from '../lib/supabaseAdmin';
import { Resend } from 'resend';

export const contactRouter = Router();
let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) {
    if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
};

const contactSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    topic: z.string().max(100).optional(),
    message: z.string().min(1).max(2000),
    turnstileToken: z.string().min(1),
    honeypot: z.string().max(0).optional(), // Honeypot field must be empty
  }).strict()
});

contactRouter.post('/', validate(contactSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, topic, message, turnstileToken, honeypot } = req.body;

    if (honeypot) {
      // Honeypot was filled, act like it succeeded but do nothing
      return res.json({ success: true });
    }

    // Verify turnstile token
    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${env.TURNSTILE_SECRET}&response=${turnstileToken}`
    });
    const turnstileResult = await turnstileRes.json();
    if (!turnstileResult.success) {
      return res.status(400).json({ error: { message: 'Bot verification failed' } });
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    // Insert into DB
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        topic,
        message,
        ip_hash: ipHash
      });

    if (dbError) {
      req.log.error(dbError, 'Failed to save contact message');
      return res.status(500).json({ error: { message: 'Internal server error' } });
    }

    // Email owner
    await getResend().emails.send({
      from: 'Maple Leaf Moving Contact <hi@mapleleafmovingco.com>',
      to: 'hi@mapleleafmovingco.com',
      subject: `New Contact Message: ${topic || 'General Inquiry'}`,
      html: `
        <h2>New message from ${name}</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Topic:</strong> ${topic || 'None'}</p>
        <hr/>
        <p>${message}</p>
      `
    });

    res.json({ success: true });
  } catch (error) {
    req.log.error(error, 'Contact form error');
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});
