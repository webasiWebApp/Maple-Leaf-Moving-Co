import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { supabase } from '../lib/supabaseAdmin';

export const ordersRouter = Router();

const statusSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }).strict()
});

ordersRouter.get('/:id/status', validate(statusSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, subtotal_cents, tax_cents, total_cents, move_date')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }

    // Return minimal status only, no PII
    res.json(data);
  } catch (error) {
    req.log.error(error, 'Order status error');
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});
