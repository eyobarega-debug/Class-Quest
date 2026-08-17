const express = require('express');
const {
  listChallenges,
  getChallenge,
  getChallengeForAdmin,
  createChallenge,
  updateChallenge,
  deleteChallenge,
} = require('../controllers/challengeController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Every route requires login - this is a private class platform,
// nothing challenge-related is public.
router.get('/', requireAuth, asyncHandler(listChallenges));
router.post('/', requireAuth, requireAdmin, asyncHandler(createChallenge));

// IMPORTANT: the more specific "/:idOrSlug/admin" route must be
// registered before the generic "/:idOrSlug" route, or Express would
// match "admin" as if it were an idOrSlug value on the line below.
router.get('/:idOrSlug/admin', requireAuth, requireAdmin, asyncHandler(getChallengeForAdmin));
router.get('/:idOrSlug', requireAuth, asyncHandler(getChallenge));

router.put('/:id', requireAuth, requireAdmin, asyncHandler(updateChallenge));
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(deleteChallenge));

module.exports = router;