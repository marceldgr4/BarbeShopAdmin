import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import { errorHandler, requestLogger } from '@barbershop/shared';
import serviceRoutes from './routes/service.routes';

const app = express();
const PORT = process.env.PORT ?? 3003;

app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'services', status: 'ok' } })
);

app.use('/', serviceRoutes);
app.use(errorHandler);

app.listen(PORT, () => console.log(`✂️  Services service on port ${PORT}`));
export default app;
