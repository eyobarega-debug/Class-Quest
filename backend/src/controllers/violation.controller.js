import {
  createTestSession,
  getActiveTestSession,
  createViolation,
  endTestSession,
  getSessionViolations,
  getRecentViolations,
} from "../models/violation.model.js";


// STUDENT: Start a monitoring session
export async function startTestSession(req, res) {
  try {
    const { challengeId } = req.body;

    if (!challengeId) {
      return res.status(400).json({
        message: "challengeId is required",
      });
    }

    // Prevent multiple active sessions
    const existing = await getActiveTestSession({
      userId: req.user.id,
      challengeId,
    });

    if (existing) {
      return res.json({
        session: existing,
      });
    }

    const session = await createTestSession({
      userId: req.user.id,
      challengeId,
    });

    res.status(201).json({
      session,
    });
  } catch (error) {
    console.error("START TEST SESSION ERROR:", error);

    res.status(500).json({
      message: "Failed to start test session",
    });
  }
}


// STUDENT: Report a violation
export async function reportViolation(req, res) {
  try {
    const {
      sessionId,
      challengeId,
      eventType,
      applicationName,
      windowTitle,
      details,
    } = req.body;

    if (!sessionId || !challengeId || !eventType) {
      return res.status(400).json({
        message:
          "sessionId, challengeId and eventType are required",
      });
    }

    // Make sure the session belongs to this student
    const session = await getActiveTestSession({
      userId: req.user.id,
      challengeId,
    });

    if (!session) {
      return res.status(403).json({
        message: "No active test session",
      });
    }

    if (Number(session.id) !== Number(sessionId)) {
      return res.status(403).json({
        message: "Invalid test session",
      });
    }

    const violation = await createViolation({
      sessionId,
      userId: req.user.id,
      challengeId,
      eventType,
      applicationName,
      windowTitle,
      details,
    });

    res.status(201).json({
      message: "Violation recorded",
      violation,
    });
  } catch (error) {
    console.error("REPORT VIOLATION ERROR:", error);

    res.status(500).json({
      message: "Failed to record violation",
    });
  }
}


// STUDENT: End test session
export async function finishTestSession(req, res) {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        message: "sessionId is required",
      });
    }

    const session = await endTestSession(
      sessionId,
      "completed"
    );

    if (!session) {
      return res.status(404).json({
        message: "Test session not found",
      });
    }

    res.json({
      message: "Test session completed",
      session,
    });
  } catch (error) {
    console.error("FINISH TEST SESSION ERROR:", error);

    res.status(500).json({
      message: "Failed to finish test session",
    });
  }
}


// ADMIN: Get violations for a session
export async function getViolationsForSession(
  req,
  res
) {
  try {
    const { sessionId } = req.params;

    const violations =
      await getSessionViolations(sessionId);

    res.json({
      violations,
    });
  } catch (error) {
    console.error(
      "GET SESSION VIOLATIONS ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to get violations",
    });
  }
}


// ADMIN: Get recent violations
export async function getViolations(req, res) {
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

    res.json({
      violations,
    });
  } catch (error) {
    console.error(
      "GET VIOLATIONS ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to get violations",
    });
  }
}