import {
  createTestSession,
  getActiveTestSession,
  createViolation,
  endTestSession,
  getSessionViolations,
  getRecentViolations,
} from "../models/violation.model.js";

// ==========================================
// STUDENT: START TEST SESSION
// ==========================================

export async function startTestSession(req, res) {
  try {
    const {
      challengeId,
      examAttemptId,
    } = req.body;

    if (!challengeId && !examAttemptId) {
      return res.status(400).json({
        message:
          "challengeId or examAttemptId is required",
      });
    }

    const existing =
      await getActiveTestSession({
        userId: req.user.id,
        challengeId,
        examAttemptId,
      });

    if (existing) {
      return res.json({
        session: existing,
      });
    }

    const session =
      await createTestSession({
        userId: req.user.id,
        challengeId,
        examAttemptId,
      });

    return res.status(201).json({
      session,
    });
  } catch (error) {
    console.error(
      "START TEST SESSION ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to start test session",
    });
  }
}

// ==========================================
// STUDENT: REPORT VIOLATION
// ==========================================

export async function reportViolation(req, res) {
  try {
    const {
      sessionId,
      challengeId,
      examAttemptId,
      eventType,
      applicationName,
      windowTitle,
      details,
    } = req.body;

    if (
      !sessionId ||
      (!challengeId && !examAttemptId) ||
      !eventType
    ) {
      return res.status(400).json({
        message:
          "sessionId, (challengeId or examAttemptId) and eventType are required",
      });
    }

    const session =
      await getActiveTestSession({
        userId: req.user.id,
        challengeId,
        examAttemptId,
      });

    if (!session) {
      return res.status(403).json({
        message:
          "No active test session",
      });
    }

    if (
      Number(session.id) !==
      Number(sessionId)
    ) {
      return res.status(403).json({
        message:
          "Invalid test session",
      });
    }

    const violation =
      await createViolation({
        sessionId,
        userId: req.user.id,
        challengeId,
        examAttemptId,
        eventType,
        applicationName,
        windowTitle,
        details,
      });

    return res.status(201).json({
      message: "Violation recorded",
      violation,
    });
  } catch (error) {
    console.error(
      "REPORT VIOLATION ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to record violation",
    });
  }
}

// ==========================================
// STUDENT: FINISH TEST SESSION
// ==========================================

export async function finishTestSession(
  req,
  res
) {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        message:
          "sessionId is required",
      });
    }

    const session =
      await endTestSession(
        sessionId,
        "completed"
      );

    if (!session) {
      return res.status(404).json({
        message:
          "Test session not found",
      });
    }

    return res.json({
      message:
        "Test session completed",
      session,
    });
  } catch (error) {
    console.error(
      "FINISH TEST SESSION ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to finish test session",
    });
  }
}

// ==========================================
// ADMIN: GET SESSION VIOLATIONS
// ==========================================

export async function getViolationsForSession(
  req,
  res
) {
  try {
    const { sessionId } = req.params;

    const violations =
      await getSessionViolations(
        sessionId
      );

    return res.json({
      violations,
    });
  } catch (error) {
    console.error(
      "GET SESSION VIOLATIONS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to get violations",
    });
  }
}

// ==========================================
// ADMIN: GET ALL RECENT VIOLATIONS
// ==========================================

export async function getViolations(
  req,
  res
) {
  try {
    const limit = Math.min(
      Number(req.query.limit) || 100,
      500
    );

    const offset =
      Number(req.query.offset) || 0;

    const violations =
      await getRecentViolations({
        limit,
        offset,
      });

    return res.json({
      violations,
    });
  } catch (error) {
    console.error(
      "GET VIOLATIONS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to get violations",
    });
  }
}