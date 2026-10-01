import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { env } from '../config/env';

export const mapsRouter = Router();

const autocompleteSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(200),
  }).strict()
});

mapsRouter.get('/autocomplete', validate(autocompleteSchema), async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const apiKey = env.GOOGLE_MAPS_API_KEY;
    
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q as string)}&components=country:ca&key=${apiKey}`;
    
    const googleRes = await fetch(url);
    const data = await googleRes.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      req.log.error(data, 'Google Maps API error');
      return res.status(500).json({ error: { message: 'Failed to fetch places' } });
    }
    
    res.json(data);
  } catch (error) {
    req.log.error(error, 'Maps autocomplete error');
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});
