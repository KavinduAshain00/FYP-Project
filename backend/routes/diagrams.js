const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const auth = require('../middleware/auth');
const diagramsController = require('../controllers/diagramsController');
const { DIAGRAM_LIMIT } = require('../constants/rateLimit');

const diagramLimiter = rateLimit({
  windowMs: DIAGRAM_LIMIT.windowMs,
  max: DIAGRAM_LIMIT.max,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: DIAGRAM_LIMIT.message,
});

router.post('/generate', auth, diagramLimiter, diagramsController.generate);
router.post('/validate', auth, diagramsController.validate);

module.exports = router;
