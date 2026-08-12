// Express 4 does NOT automatically catch a rejected promise thrown
// inside an `async` route handler - it just hangs or crashes the
// process. Wrapping every controller in this function catches the
// rejection and forwards it to the central error handler in
// server.js instead.
//
// Usage:  router.get('/', asyncHandler(controllerFn))
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
