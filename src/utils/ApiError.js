class ApiError extends Error {
  constructor(
    statusCode,
    stack = "",
    message = "something went wrong",
    error = []
  ) {
    super(message)(
      (this.statusCode = statusCode),
      (this.message = message),
      (this.error = error),
      (this.data = this.data),
      (this.success = false),
      (this.data = null)
    );
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export { ApiError };
