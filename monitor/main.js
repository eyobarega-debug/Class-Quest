const { app } = require("electron");

const http = require("http");
const https = require("https");
const { URL } = require("url");
const { activeWindow } = require("get-windows");

const MONITOR_PORT = 3847;

// ===============================
// DEFAULT BACKEND
// ===============================

const DEFAULT_API_BASE_URL =
  "https://classquest-backend.onrender.com/api";

let monitoring = false;
let session = null;
let authToken = null;
let allowedTitle = "";
let apiBaseUrl = DEFAULT_API_BASE_URL;
let lastViolation = null;

// ===============================
// BROWSERS
// ===============================

const browsers = [
  "chrome.exe",
  "msedge.exe",
  "firefox.exe",
  "brave.exe",
  "opera.exe",
];

// ===============================
// SEND JSON
// ===============================

function sendJSON(
  res,
  statusCode,
  data
) {
  res.writeHead(statusCode, {
    "Content-Type":
      "application/json",

    "Access-Control-Allow-Origin":
      "*",

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type",
  });

  res.end(
    JSON.stringify(data)
  );
}

// ===============================
// REPORT VIOLATION
// ===============================

async function reportViolation(
  windowInfo
) {
  if (
    !monitoring ||
    !session ||
    !authToken
  ) {
    return;
  }

  const applicationName =
    windowInfo.owner?.name ||
    "Unknown Application";

  const windowTitle =
    windowInfo.title || "";

  const violationKey =
    `${applicationName}|${windowTitle}`;

  // Prevent duplicate reports
  if (
    lastViolation ===
    violationKey
  ) {
    return;
  }

  lastViolation =
    violationKey;

  const data =
    JSON.stringify({
      sessionId:
        session.sessionId,

      challengeId:
        session.challengeId ||
        undefined,

      examAttemptId:
        session.examAttemptId ||
        undefined,

      eventType:
        "APPLICATION_SWITCH",

      applicationName,

      windowTitle,

      details: {
        source:
          "electron-monitor",

        timestamp:
          new Date().toISOString(),
      },
    });

  // ===============================
  // BACKEND URL
  // ===============================

  let target;

  try {
    const base =
      apiBaseUrl.replace(
        /\/$/,
        ""
      );

    target = new URL(
      `${base}/violations/report`
    );
  } catch (error) {
    console.error(
      "Invalid API URL:",
      apiBaseUrl
    );

    return;
  }

  const transport =
    target.protocol === "https:"
      ? https
      : http;

  // ===============================
  // SEND REQUEST
  // ===============================

  const request =
    transport.request(
      {
        hostname:
          target.hostname,

        port:
          target.port ||
          (target.protocol ===
          "https:"
            ? 443
            : 80),

        path:
          target.pathname +
          target.search,

        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Content-Length":
            Buffer.byteLength(
              data
            ),

          Authorization:
            `Bearer ${authToken}`,
        },
      },

      (res) => {
        let body = "";

        res.on(
          "data",
          (chunk) => {
            body += chunk;
          }
        );

        res.on(
          "end",
          () => {
            console.log(
              "================================"
            );

            console.log(
              "VIOLATION REPORT"
            );

            console.log(
              "Status:",
              res.statusCode
            );

            console.log(
              "Response:",
              body
            );

            console.log(
              "================================"
            );
          }
        );
      }
    );

  request.on(
    "error",
    (error) => {
      console.error(
        "Could not report violation:",
        error.message
      );
    }
  );

  request.write(data);
  request.end();

  console.log("");
  console.log(
    "🚨 VIOLATION DETECTED"
  );
  console.log(
    "Application:",
    applicationName
  );
  console.log(
    "Window:",
    windowTitle
  );
  console.log(
    "Reporting to:",
    apiBaseUrl
  );
  console.log(
    "-------------------------"
  );
}

// ===============================
// CHECK ACTIVE WINDOW
// ===============================

async function checkActiveWindow() {
  if (!monitoring) {
    return;
  }

  try {
    const windowInfo =
      await activeWindow();

    if (!windowInfo) {
      return;
    }

    const applicationName =
      windowInfo.owner?.name ||
      "";

    const title =
      windowInfo.title ||
      "";

    console.log(
      "Active:",
      applicationName,
      "|",
      title
    );

    // ===============================
    // CHECK TITLE
    // ===============================

    const titleMatches =
      allowedTitle &&
      title.includes(
        allowedTitle
      );

    // ===============================
    // CHECK BROWSER
    // ===============================

    const executable =
      windowInfo.owner?.path
        ?.split("\\")
        .pop()
        ?.toLowerCase();

    const isBrowser =
      browsers.includes(
        executable
      );

    // ===============================
    // VIOLATION
    // ===============================

    if (
      !titleMatches &&
      !isBrowser
    ) {
      await reportViolation(
        windowInfo
      );
    }

    // Browser but wrong page
    if (
      isBrowser &&
      !titleMatches
    ) {
      await reportViolation(
        windowInfo
      );
    }

    // Correct ClassQuest page
    if (titleMatches) {
      lastViolation = null;
    }
  } catch (error) {
    console.error(
      "Window detection error:",
      error.message
    );
  }
}

// ===============================
// LOCAL MONITOR SERVER
// ===============================

function startServer() {
  const server =
    http.createServer(
      (req, res) => {

        // ===============================
        // OPTIONS
        // ===============================

        if (
          req.method ===
          "OPTIONS"
        ) {
          return sendJSON(
            res,
            200,
            { ok: true }
          );
        }

        // ===============================
        // STATUS
        // ===============================

        if (
          req.method === "GET" &&
          req.url === "/status"
        ) {
          return sendJSON(
            res,
            200,
            {
              monitoring,
              session,
            }
          );
        }

        // ===============================
        // START
        // ===============================

        if (
          req.method === "POST" &&
          req.url === "/start"
        ) {
          let body = "";

          req.on(
            "data",
            (chunk) => {
              body += chunk;
            }
          );

          req.on(
            "end",
            () => {
              try {
                const data =
                  JSON.parse(
                    body
                  );

                if (
                  !data.sessionId ||
                  (
                    !data.challengeId &&
                    !data.examAttemptId
                  ) ||
                  !data.token
                ) {
                  return sendJSON(
                    res,
                    400,
                    {
                      message:
                        "sessionId, (challengeId or examAttemptId) and token are required",
                    }
                  );
                }

                // ===============================
                // SAVE SESSION
                // ===============================

                session = {
                  sessionId:
                    data.sessionId,

                  challengeId:
                    data.challengeId ||
                    null,

                  examAttemptId:
                    data.examAttemptId ||
                    null,
                };

                // ===============================
                // SAVE AUTH
                // ===============================

                authToken =
                  data.token;

                // ===============================
                // SAVE ALLOWED TITLE
                // ===============================

                allowedTitle =
                  data.allowedTitle ||
                  "ClassQuest";

                // ===============================
                // SAVE API URL
                // ===============================

                apiBaseUrl =
                  data.apiBaseUrl ||
                  DEFAULT_API_BASE_URL;

                monitoring = true;

                lastViolation =
                  null;

                console.log("");

                console.log(
                  "================================"
                );

                console.log(
                  "CLASSQUEST MONITOR STARTED"
                );

                console.log(
                  "Session:",
                  session.sessionId
                );

                console.log(
                  "Challenge:",
                  session.challengeId
                );

                console.log(
                  "Exam attempt:",
                  session.examAttemptId
                );

                console.log(
                  "Allowed title:",
                  allowedTitle
                );

                console.log(
                  "Reporting to:",
                  apiBaseUrl
                );

                console.log(
                  "================================"
                );

                console.log("");

                return sendJSON(
                  res,
                  200,
                  {
                    message:
                      "Monitoring started",
                  }
                );
              } catch (error) {
                return sendJSON(
                  res,
                  400,
                  {
                    message:
                      "Invalid JSON",
                  }
                );
              }
            }
          );

          return;
        }

        // ===============================
        // STOP
        // ===============================

        if (
          req.method === "POST" &&
          req.url === "/stop"
        ) {
          monitoring = false;

          session = null;

          authToken = null;

          allowedTitle = "";

          apiBaseUrl =
            DEFAULT_API_BASE_URL;

          lastViolation =
            null;

          console.log(
            "CLASSQUEST MONITOR STOPPED"
          );

          return sendJSON(
            res,
            200,
            {
              message:
                "Monitoring stopped",
            }
          );
        }

        // ===============================
        // NOT FOUND
        // ===============================

        return sendJSON(
          res,
          404,
          {
            message:
              "Not found",
          }
        );
      }
    );

  server.listen(
    MONITOR_PORT,
    "127.0.0.1",
    () => {
      console.log(
        `ClassQuest Monitor running on http://127.0.0.1:${MONITOR_PORT}`
      );
    }
  );
}

// ===============================
// ELECTRON
// ===============================

app.whenReady().then(() => {
  startServer();

  setInterval(
    checkActiveWindow,
    1000
  );
});

app.on(
  "window-all-closed",
  () => {
    // Keep monitor running
  }
);