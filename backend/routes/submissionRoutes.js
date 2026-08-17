const express = require('express');
const { run, submit } = require('../controllers/submissionController');
const { requireAuth } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/run', requireAuth, asyncHandler(run));
router.post('/submit', requireAuth, asyncHandler(submit));

module.exports = router;