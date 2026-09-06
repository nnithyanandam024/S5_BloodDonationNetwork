import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { donorsRouter } from './routes/donors';
import { requestsRouter } from './routes/requests';
import { matchingRouter } from './routes/matching';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Emergency Blood Donation API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/donors', donorsRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/matching', matchingRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Emergency Blood Donation Server running `);
    console.log(` Port: ${PORT}                           `);
    console.log(` Health: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
}
