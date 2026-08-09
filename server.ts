import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // BulkSMSBD Proxy Route - Send SMS
  app.post('/api/send-sms', async (req, res) => {
    try {
      const { apiKey, senderId, number, message } = req.body;
      const key = apiKey || process.env.BULKSMSBD_API_KEY || 'SSUCS5sjSU4MFQZcJT8c';
      const sender = senderId || process.env.BULKSMSBD_SENDER_ID || '8809648909593';

      if (!number || !message) {
        return res.status(400).json({ success: false, message: 'নম্বর এবং মেসেজ দেওয়া আবশ্যক!' });
      }

      const targetUrl = `https://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(key)}&type=text&number=${encodeURIComponent(number)}&senderid=${encodeURIComponent(sender)}&message=${encodeURIComponent(message)}`;

      const response = await fetch(targetUrl, { method: 'GET' });
      const text = await response.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }

      const isSuccess = json?.response_code === 1101 || json?.response_code === '1101' || text.includes('1101');

      return res.json({
        success: isSuccess,
        response_code: json?.response_code || (isSuccess ? 1101 : 1000),
        message: json?.success_message || json?.error_message || text || 'প্রসেস সফল হয়েছে',
        data: json
      });
    } catch (err: any) {
      console.error('Send SMS error:', err);
      return res.status(500).json({ success: false, message: err.message || 'এসএমএস পাঠাতে সমস্যা হয়েছে' });
    }
  });

  // BulkSMSBD Proxy Route - Balance Check
  app.get('/api/sms-balance', async (req, res) => {
    try {
      const apiKey = (req.query.apiKey as string) || process.env.BULKSMSBD_API_KEY || 'SSUCS5sjSU4MFQZcJT8c';
      const targetUrl = `https://bulksmsbd.net/api/getBalanceApi?api_key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(targetUrl);
      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error('SMS Balance check error:', err);
      return res.status(500).json({ success: false, message: err.message || 'ব্যালেন্স চেক ব্যর্থ হয়েছে' });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
