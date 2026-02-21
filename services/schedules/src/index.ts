import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import { errorHandler, requestLogger } from '@barbershop/shared';
import scheduleRoutes from './routes/schedule.routes';

const app = express();
const PORT = process.env.PORT ?? 3004;

app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'schedules', status: 'ok' } })
);

app.use('/', scheduleRoutes);
app.use(errorHandler);

app.listen(PORT, () => console.log(`📅 Schedules service on port ${PORT}`));
export default app;
