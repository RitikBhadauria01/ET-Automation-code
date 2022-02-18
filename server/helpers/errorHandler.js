import AppError from './AppError';
import config from '../../config/env';

import responseObjectClass from './responseObjectClass';

const responseObject = new responseObjectClass();

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = err.errors.map((error) => error.messages.join('')).join(' and ');
  return new AppError(errors, 400);
};

const handleJWTError = () => new AppError('Invalid Access Token', 401);

const handleJWTExpiredError = () => new AppError('Access token Expired', 402);

const handleJWTMissing = () => new AppError('UNAUTHORIZED', 401);

const sendErrorResponse = (err, req, res) => {
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    const returnObj = responseObject.create({
      code: err.statusCode,
      message: err.message,
    });
    return res.send(returnObj);
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  const returnObj = responseObject.create({
    data: config.env === 'development' ? err : {},
  });
  return res.send(returnObj);
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;

  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError' || error.message === 'validation error')
    error = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (error.message === 'No auth token') error = handleJWTMissing();

  sendErrorResponse(error, req, res);
};