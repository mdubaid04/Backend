class ApiResponse {
  constructor(statusCode, message = "Success", data) {
    ((this.statuscode = statuscode),
      (this.message = message),
      (this.data = data),
      (this.status = statuscode < 400));
  }
}
export { ApiResponse };
