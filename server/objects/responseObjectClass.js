export default class ResponseObject {
  constructor(code = 400, message = '', success = false, data = {}) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.success = success;
  }

  generateResponseObject(params) {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
      success: this.success,
      ...params,
    };
  }
}
