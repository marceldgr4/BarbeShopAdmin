import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import { errorHandler, requestLogger } from '@barbershop/shared';
import barberRoutes from './routes/barber.routes';

const app = express();
const PORT = process.env.PORT ?? 3002;

app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { service: 'barbers', status: 'ok' } });
});

app.use('/', barberRoutes);
app.use(errorHandler);

app.listen(PORT, () => console.log(`💈 Barbers service on port ${PORT}`));

export default app;
