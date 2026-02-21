import { Router } from 'express';
import {
  getDashboardStats,
  getAppointmentsByDay,
  getOccupancyByBarber,
  getRevenueEstimate,
} from '../controllers/dashboard.controller';

const router = Router();

// GET /                 → main KPI stats (totals, rates, top lists)
// GET /appointments/by-day → time-series for the chart
// GET /barbers/occupancy   → occupancy per barber in a period
// GET /revenue             → estimated revenue by month

router.get('/',                      getDashboardStats);
router.get('/appointments/by-day',   getAppointmentsByDay);
router.get('/barbers/occupancy',     getOccupancyByBarber);
router.get('/revenue',               getRevenueEstimate);

export default router;
