import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import { errorHandler, requestLogger } from '@barbershop/shared';
import barbershopRoutes from './routes/barbershop.routes';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());
app.use(requestLogger);

// Internal health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { service: 'barbershops', status: 'ok' } });
});

// Routes — note: gateway already stripped /api/admin/barbershops prefix
app.use('/', barbershopRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🏪 Barbershops service on port ${PORT}`);
});

export default app;
