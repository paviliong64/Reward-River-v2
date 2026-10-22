import type { Request, Response } from 'express';
import app from '../server';
import { dbStore } from '../server/db';

let isInitialized = false;

export default async function handler(req: Request, res: Response) {
  if (!isInitialized) {
    try {
      await dbStore.init();
      isInitialized = true;
    } catch (err) {
      console.warn('[Vercel Serverless] Database init warning:', err);
    }
  }

  return app(req, res);
}
