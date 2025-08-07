import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

/**
 * @route GET /api/health
 * @desc Basic health check
 * @access Public
 */
router.get('/', healthController.healthCheck);

/**
 * @route GET /api/health/detailed
 * @desc Detailed health check with dependency status
 * @access Public
 */
router.get('/detailed', healthController.detailedHealthCheck);

/**
 * @route GET /api/health/ready
 * @desc Readiness probe for Kubernetes/Docker
 * @access Public
 */
router.get('/ready', healthController.readinessCheck);

/**
 * @route GET /api/health/live
 * @desc Liveness probe for Kubernetes/Docker
 * @access Public
 */
router.get('/live', healthController.livenessCheck);

/**
 * @route GET /api/health/metrics
 * @desc Metrics endpoint for monitoring
 * @access Public
 */
router.get('/metrics', healthController.getMetrics);

/**
 * @route GET /api/health/system
 * @desc System information endpoint
 * @access Public
 */
router.get('/system', healthController.getSystemInfo);

export default router;