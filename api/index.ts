import app from '../server';

// Serverless Handler with URL normalization for Vercel
export default function handler(req: any, res: any) {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
