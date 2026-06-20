import express from 'express';

import pool from '../config/db.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validateServiceRequest } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
        `SELECT
        u.user_id,
        u.full_name,
        h.address,
        h.district,
        ws.system_id,
        ws.system_name,
        ws.status AS system_status,
        wt.tank_id,
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
        ) AS battery_level_percent,
        (
          SELECT eh.energy_generated_wh
          FROM energy_history eh
          WHERE eh.system_id = ws.system_id
          ORDER BY eh.reading_datetime DESC
          LIMIT 1
        ) AS energy_generated_wh
      FROM users u
      JOIN households h ON u.user_id = h.user_id
      JOIN wai_systems ws ON h.household_id = ws.household_id
      JOIN water_tanks wt ON ws.system_id = wt.system_id
      WHERE u.user_id = ?`,
        [userId]
    );

    return res.json(rows[0] || {});
  } catch (error) {
    console.error('Dashboard error:', error);

    return res.status(500).json({
      message: 'Dashboard data could not be loaded.',
    });
  }
});

router.get('/water-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
        `SELECT
        wlh.reading_datetime,
        wlh.water_level_liters,
        wlh.water_level_percent,
        wlh.daily_usage_liters,
        wlh.status
      FROM users u
      JOIN households h ON u.user_id = h.user_id
      JOIN wai_systems ws ON h.household_id = ws.household_id
      JOIN water_tanks wt ON ws.system_id = wt.system_id
      JOIN water_level_history wlh ON wt.tank_id = wlh.tank_id
      WHERE u.user_id = ?
      ORDER BY wlh.reading_datetime DESC`,
        [userId]
    );

    return res.json(rows);
  } catch (error) {
    console.error('Water history error:', error);

    return res.status(500).json({
      message: 'Water history could not be loaded.',
    });
  }
});

router.get('/energy-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
        `SELECT
        eh.reading_datetime,
        eh.energy_generated_wh,
        eh.battery_level_percent,
        eh.status
      FROM users u
      JOIN households h ON u.user_id = h.user_id
      JOIN wai_systems ws ON h.household_id = ws.household_id
      JOIN energy_history eh ON ws.system_id = eh.system_id
      WHERE u.user_id = ?
      ORDER BY eh.reading_datetime DESC`,
        [userId]
    );

    return res.json(rows);
  } catch (error) {
    console.error('Energy history error:', error);

    return res.status(500).json({
      message: 'Energy history could not be loaded.',
    });
  }
});

router.get('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
        `SELECT
        notification_id,
        title,
        message,
        type,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC`,
        [userId]
    );

    return res.json(rows);
  } catch (error) {
    console.error('Notifications error:', error);

    return res.status(500).json({
      message: 'Notifications could not be loaded.',
    });
  }
});

router.get('/services', async (req, res) => {
  try {
    const [rows] = await pool.query(
        'SELECT * FROM services WHERE active = 1 ORDER BY service_name'
    );

    return res.json(rows);
  } catch (error) {
    console.error('Services error:', error);

    return res.status(500).json({
      message: 'Services could not be loaded.',
    });
  }
});

router.post('/service-request', validateServiceRequest, async (req, res) => {
  try {
    const { user_id, service_id, preferred_date, description } = req.body;

    const [systems] = await pool.query(
        `SELECT ws.system_id
      FROM wai_systems ws
      JOIN households h ON ws.household_id = h.household_id
      WHERE h.user_id = ?
      LIMIT 1`,
        [user_id || req.user.user_id]
    );

    if (systems.length === 0) {
      return res.status(404).json({
        message: 'No WAI system found for this user.',
      });
    }

    const [result] = await pool.query(
        `INSERT INTO service_requests
        (user_id, system_id, service_id, request_date,
         preferred_date, description, status)
       VALUES (?, ?, ?, CURDATE(), ?, ?, 'pending')`,
        [
          user_id || req.user.user_id,
          systems[0].system_id,
          service_id,
          preferred_date || null,
          description || null,
        ]
    );

    return res.status(201).json({
      message: 'Service request submitted.',
      request_id: result.insertId,
    });
  } catch (error) {
    console.error('Create service request error:', error);

    return res.status(500).json({
      message: 'Service request could not be saved.',
    });
  }
});

router.get('/service-requests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
        `SELECT
        sr.request_id,
        s.service_name,
        sr.request_date,
        sr.preferred_date,
        sr.description,
        sr.status
      FROM service_requests sr
      JOIN services s ON sr.service_id = s.service_id
      WHERE sr.user_id = ?
      ORDER BY sr.created_at DESC`,
        [userId]
    );

    return res.json(rows);
  } catch (error) {
    console.error('Service requests error:', error);

    return res.status(500).json({
      message: 'Service requests could not be loaded.',
    });
  }
});

export default router;
