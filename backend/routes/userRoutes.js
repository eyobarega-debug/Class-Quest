const express = require('express');
const { listStudents, createStudent, setStudentStatus } = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Every route below requires a valid login AND the admin role.
// requireAuth runs first (decodes the token), then requireAdmin
// checks req.user.role - if either fails, the request never
// reaches the controller function.
router.get('/', requireAuth, requireAdmin, asyncHandler(listStudents));
router.post('/', requireAuth, requireAdmin, asyncHandler(createStudent));
router.put('/:id/status', requireAuth, requireAdmin, asyncHandler(setStudentStatus));
router.delete("/:id", asyncHandler(deleteStudent));

module.exports = router;
