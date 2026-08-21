import axios from "axios";

const client = axios.create({
  baseURL: "https://classquest-backend.onrender.com/api",
});

// ===============================
// AUTH TOKEN
// ===============================

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("classquest_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ===============================
// ERROR HANDLING
// ===============================

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";

    return Promise.reject(new Error(message));
  }
);


// ===============================
// API
// ===============================

export const api = {
  // ===============================
  // AUTH
  // ===============================

  me: async () => {
    const res = await client.get("/auth/me");
    return res.data;
  },

  login: async (username, password) => {
    const res = await client.post("/auth/login", {
      username,
      password,
    });

    return res.data;
  },

  register: async ({
    username,
    email,
    password,
    fullName,
  }) => {
    const res = await client.post("/auth/register", {
      username,
      email,
      password,
      fullName,
    });

    return res.data;
  },

  // ===============================
  // STUDENTS
  // ===============================

  students: async () => {
    const res = await client.get("/users");

    return res.data.students;
  },

  createStudent: async ({
    username,
    email,
    password,
    fullName,
  }) => {
    const res = await client.post("/users", {
      username,
      email,
      password,
      fullName,
    });

    return res.data;
  },

  updateStudentStatus: async (id, isActive) => {
    const res = await client.put(
      `/users/${id}/status`,
      { isActive }
    );

    return res.data;
  },

  deleteStudent: async (id) => {
    await client.delete(`/users/${id}`);
  },

  // ===============================
  // CHALLENGES & QUESTIONS
  // ===============================

  challenges: async (filters = {}) => {
    const params = {};

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.language) {
      params.language = filters.language;
    }

    if (filters.difficulty) {
      params.difficulty = filters.difficulty;
    }

    if (filters.category) {
      params.category = filters.category;
    }

    const res = await client.get("/challenges", {
      params,
    });

    return res.data.challenges;
  },

  challenge: async (slug) => {
    const res = await client.get(
      `/challenges/${slug}`
    );

    return res.data;
  },

  createChallenge: async (payload) => {
    const res = await client.post(
      "/challenges",
      payload
    );

    return res.data.challenge;
  },

  updateChallenge: async (id, payload) => {
    const res = await client.patch(
      `/challenges/${id}`,
      payload
    );

    return res.data.challenge;
  },

  deleteChallenge: async (id) => {
    await client.delete(`/challenges/${id}`);
  },

  // ===============================
  // CODE RUN & SUBMISSION
  // ===============================

  runCode: async ({
    slug,
    language,
    source_code,
  }) => {
    const res = await client.post(
      `/challenges/${slug}/run`,
      {
        language,
        sourceCode: source_code,
      }
    );

    return res.data;
  },

  submitCode: async ({
    slug,
    language,
    source_code,
    examAttemptId,
  }) => {
    const res = await client.post(
      `/challenges/${slug}/submit`,
      {
        language,
        sourceCode: source_code,
        examAttemptId,
      }
    );

    return res.data;
  },

  // ===============================
  // ADMIN: WHAT STUDENTS HAVE SUBMITTED
  // ===============================

  // Every coding submission across all students (source code + score
  // "out of" the test cases, not XP). Optional filters.
  adminSubmissions: async ({ studentId, challengeId } = {}) => {
    const params = {};
    if (studentId) params.studentId = studentId;
    if (challengeId) params.challengeId = challengeId;

    const res = await client.get("/challenges/submissions", { params });
    return res.data.submissions;
  },

  adminSubmissionDetail: async (id) => {
    const res = await client.get(`/challenges/submissions/${id}`);
    return res.data.submission;
  },

  // ===============================
  // VIOLATION MONITORING
  // ===============================

    // Start a monitoring session. Accepts either a plain challengeId
  // (existing standalone-challenge behavior, unchanged) or
  // { challengeId, examAttemptId } for an exam session.
  startTestSession: async (challengeIdOrOptions) => {
    const body =
      typeof challengeIdOrOptions === "object" && challengeIdOrOptions !== null
        ? challengeIdOrOptions
        : { challengeId: challengeIdOrOptions };

    const res = await client.post(
      "/violations/sessions/start",
      body
    );

    return res.data;
  },

  reportViolation: async ({
    sessionId,
    challengeId,
    examAttemptId,
    eventType,
    applicationName,
    windowTitle,
    details,
  }) => {
    const res = await client.post(
      "/violations/report",
      {
        sessionId,
        challengeId,
        examAttemptId,
        eventType,
        applicationName,
        windowTitle,
        details,
      }
    );

    return res.data;
  },

  finishTestSession: async (sessionId) => {
    const res = await client.post(
      "/violations/sessions/finish",
      {
        sessionId,
      }
    );

    return res.data.session;
  },

  // ===============================
  // ADMIN VIOLATIONS
  // ===============================

  violations: async ({
    limit = 100,
    offset = 0,
  } = {}) => {
    const res = await client.get(
      "/violations",
      {
        params: {
          limit,
          offset,
        },
      }
    );

    return res.data.violations;
  },

    // Get violations for one session
  sessionViolations: async (sessionId) => {
    const res = await client.get(
      `/violations/session/${sessionId}`
    );

    return res.data.violations;
  },

  // ===============================
  // EXAMS
  // ===============================

  exams: async () => {
    const res = await client.get("/exams");
    return res.data.exams;
  },

  exam: async (id) => {
    const res = await client.get(`/exams/${id}`);
    return res.data; // { exam, questions? }
  },

  createExam: async ({ title, description, durationMinutes, password }) => {
    const res = await client.post("/exams", {
      title,
      description,
      durationMinutes,
      password,
    });
    return res.data.exam;
  },

  updateExam: async (id, { title, description, durationMinutes, isPublished }) => {
    const res = await client.patch(`/exams/${id}`, {
      title,
      description,
      durationMinutes,
      isPublished,
    });
    return res.data.exam;
  },

  changeExamPassword: async (id, password) => {
    const res = await client.patch(`/exams/${id}/password`, { password });
    return res.data.exam;
  },

  deleteExam: async (id) => {
    await client.delete(`/exams/${id}`);
  },

  createExamQuestion: async (examId, payload) => {
    const res = await client.post(`/exams/${examId}/questions`, payload);
    return res.data.question;
  },

  // Bulk import: create many questions on one exam in a single call
  // (e.g. paste a whole exam's worth of mcq/true_false/short_answer/
  // coding questions at once).
  createExamQuestionsBulk: async (examId, questions) => {
    const res = await client.post(`/exams/${examId}/questions/bulk`, { questions });
    return res.data.questions;
  },

  updateExamQuestion: async (examId, questionId, payload) => {
    const res = await client.patch(`/exams/${examId}/questions/${questionId}`, payload);
    return res.data.question;
  },

  deleteExamQuestion: async (examId, questionId) => {
    await client.delete(`/exams/${examId}/questions/${questionId}`);
  },

  // Student flow: verify password -> start -> answer -> finish.
  // The password is only ever sent over these two calls, never stored.

  verifyExamPassword: async (examId, password) => {
    const res = await client.post(`/exams/${examId}/verify-password`, { password });
    return res.data;
  },

  startExam: async (examId, password) => {
    const res = await client.post(`/exams/${examId}/start`, { password });
    return res.data; // { attempt, exam, questions }
  },

  examAttemptStatus: async (attemptId) => {
    const res = await client.get(`/exams/attempts/${attemptId}`);
    return res.data.attempt;
  },

  answerExamQuestion: async (attemptId, questionId, answer) => {
    const res = await client.post(`/exams/attempts/${attemptId}/answers`, {
      questionId,
      answer,
    });
    return res.data;
  },

  finishExam: async (attemptId) => {
    const res = await client.post(`/exams/attempts/${attemptId}/finish`);
    return res.data.attempt;
  },

  // ===============================
  // ADMIN: WHAT STUDENTS HAVE DONE ON AN EXAM
  // ===============================

  examAttempts: async (examId) => {
    const res = await client.get(`/exams/${examId}/attempts`);
    return res.data.attempts;
  },

  examAttemptDetail: async (attemptId) => {
    const res = await client.get(`/exams/attempts/${attemptId}/admin`);
    return res.data; // { attempt, questions }
  },

  // Flat feed of every MCQ/True-False/Short-Answer answer across every
// exam and every student — powers the "Submissions" dashboard.
examAnswers: async ({ studentId, examId } = {}) => {
  const params = {};
  if (studentId) params.studentId = studentId;
  if (examId) params.examId = examId;

  const res = await client.get("/exams/answers", { params });
  return res.data.answers;
},
};

export default client;