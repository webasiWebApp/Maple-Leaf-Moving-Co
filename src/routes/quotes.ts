import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { calculateQuote } from '../services/pricing';

export const quotesRouter = Router();

const previewSchema = z.object({
  body: z.object({
    homeSizeId: z.enum(['studio', '1bed', '2bed', '3bed', 'office']),
    items: z.record(z.string(), z.number()),
    addOns: z.array(z.string()),
    stairsFrom: z.string(),
    stairsTo: z.string(),
    distanceKm: z.number().nullable(),
    driveMinutes: z.number().nullable(),
    moveDate: z.string().refine((d) => {
      const parsedDate = new Date(`${d}T12:00:00`);
      const minLeadTime = new Date();
      minLeadTime.setDate(minLeadTime.getDate() + 1); // 24 hours
      return !isNaN(parsedDate.getTime()) && parsedDate >= minLeadTime;
    }, 'Date must be at least 24 hours in the future'),
    arrivalWindow: z.string(),
    flexibleDates: z.boolean()
  }).strict()
});

quotesRouter.post('/preview', validate(previewSchema), (req: Request, res: Response) => {
  try {
    const pricingSnapshot = calculateQuote(req.body);
    res.json(pricingSnapshot);
  } catch (error) {
    req.log.error(error, 'Quote preview error');
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});
