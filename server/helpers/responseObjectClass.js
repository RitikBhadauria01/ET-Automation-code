export default class ResponseObject {
  constructor(
    code = 500,
    message = 'An error occurred, try again after some time',
    success = false,
    data = {}
  ) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.success = success;
  }

  create(params) {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
      success: this.success,
      ...params,
    };
  }
}