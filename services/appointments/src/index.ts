import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import { errorHandler, requestLogger } from '@barbershop/shared';
import appointmentRoutes from './routes/appointment.routes';

const app = express();
const PORT = process.env.PORT ?? 3006;

app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'appointments', status: 'ok' } })
);

app.use('/', appointmentRoutes);
app.use(errorHandler);

app.listen(PORT, () => console.log(`📋 Appointments service on port ${PORT}`));
export default app;
