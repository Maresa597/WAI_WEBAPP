import express from 'express';

import pool from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware.js';
import {
  validateMaintenanceLog,
  validateNotification,
  validateStatusUpdate,
} from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', async (req, res) => {
  try {
    const [[totalUsers]] = await pool.query('SELECT COUNT(*) AS count FROM users');

    const [[activeUsers]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE status = 'active'"
    );

    const [[requests]] = await pool.query('SELECT COUNT(*) AS count FROM service_requests');

    const [[lowWater]] = await pool.query(
      "SELECT COUNT(*) AS count FROM water_tanks WHERE status IN ('low', 'critical')"
    );

    const [[criticalEnergy]] = await pool.query(
      `SELECT COUNT(*) AS count
      FROM (
        SELECT eh.system_id, eh.battery_level_percent
        FROM energy_history eh
        JOIN (
          SELECT system_id, MAX(reading_datetime) AS latest
          FROM energy_history
          GROUP BY system_id
        ) latest_eh
        ON eh.system_id = latest_eh.system_id
        AND eh.reading_datetime = latest_eh.latest
        WHERE eh.battery_level_percent < 25
      ) x`
    );

    return res.json({
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      serviceRequests: requests.count,
      lowWaterSystems: lowWater.count,
      criticalEnergySystems: criticalEnergy.count,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);

    return res.status(500).json({
      message: 'Admin dashboard could not be loaded.',
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.status,
        h.address,
        h.district,
        h.number_of_residents
      FROM users u
      LEFT JOIN households h ON u.user_id = h.user_id
      ORDER BY u.user_id`
    );

    return res.json(rows);
  } catch (error) {
    console.error('Users error:', error);

    return res.status(500).json({
      message: 'Users could not be loaded.',
    });
  }
});

router.get('/systems', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        ws.system_id,
        ws.system_name,
        ws.status AS system_status,
        u.full_name,
        h.district,
        h.address,
        wt.tank_name,
        wt.capacity_liters,
        wt.current_level_liters,
        ROUND((wt.current_level_liters / wt.capacity_liters) * 100, 2)
          AS water_percent,
        wt.status AS tank_status,
        (
          SELECT eh.battery_level_percent
          FROM energy_history eh
          WHERE eh.system_id = ws.system_id
          ORDER BY eh.reading_datetime DESC
          LIMIT 1
        ) AS battery_level_percent
      FROM wai_systems ws
      JOIN households h ON ws.household_id = h.household_id
      JOIN users u ON h.user_id = u.user_id
      JOIN water_tanks wt ON ws.system_id = wt.system_id
      ORDER BY ws.system_id`
    );

    return res.json(rows);
  } catch (error) {
    console.error('Systems error:', error);

    return res.status(500).json({
      message: 'Systems could not be loaded.',
    });
  }
});

router.get('/service-requests', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        sr.request_id,
        u.full_name,
        h.district,
        s.service_name,
        sr.request_date,
        sr.preferred_date,
        sr.description,
        sr.status
      FROM service_requests sr
      JOIN users u ON sr.user_id = u.user_id
      JOIN households h ON u.user_id = h.user_id
      JOIN services s ON sr.service_id = s.service_id
      ORDER BY sr.created_at DESC`
    );

    return res.json(rows);
  } catch (error) {
    console.error('Admin service requests error:', error);

    return res.status(500).json({
      message: 'Service requests could not be loaded.',
    });
  }
});

router.put('/service-requests/:requestId/status', validateStatusUpdate, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    await pool.query('UPDATE service_requests SET status = ? WHERE request_id = ?', [
      status,
      requestId,
    ]);

    return res.json({
      message: 'Status updated.',
    });
  } catch (error) {
    console.error('Update status error:', error);

    return res.status(500).json({
      message: 'Status could not be updated.',
    });
  }
});

router.post('/maintenance-log', validateMaintenanceLog, async (req, res) => {
  try {
    const { system_id, service_id, maintenance_date, notes, next_due_date } = req.body;

    const [result] = await pool.query(
      `INSERT INTO maintenance_logs
        (system_id, service_id, maintenance_date,
         performed_by, notes, next_due_date)
       VALUES (?, ?, ?, 'WAI Service Team', ?, ?)`,
      [system_id, service_id, maintenance_date, notes || null, next_due_date || null]
    );

    return res.status(201).json({
      message: 'Maintenance log added.',
      maintenance_id: result.insertId,
    });
  } catch (error) {
    console.error('Maintenance log error:', error);

    return res.status(500).json({
      message: 'Maintenance log could not be added.',
    });
  }
});

router.post('/notification', validateNotification, async (req, res) => {
  try {
    const { user_id, system_id, title, message, type } = req.body;

    const [result] = await pool.query(
      `INSERT INTO notifications
        (user_id, system_id, title, message, type)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, system_id, title, message, type || 'info']
    );

    return res.status(201).json({
      message: 'Notification added.',
      notification_id: result.insertId,
    });
  } catch (error) {
    console.error('Notification error:', error);

    return res.status(500).json({
      message: 'Notification could not be added.',
    });
  }
});

export default router;
