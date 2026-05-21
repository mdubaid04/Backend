class ApiResponse {
  constructor(statusCode, message = "Success", data) {
    ((this.statuscode = statuscode),
      (this.data = data),
      (this.message = message),
      (this.status = statuscode < 400));
  }
}
export { ApiResponse };
