import rateLimit from 'express-rate-limit';

import responseObjectClass from './responseObjectClass';

const responseObject = new responseObjectClass();

function rateLimitMessage(req, res) {
  let returnObj = responseObject.create({
    code: 429,
    message: 'Too many requests from this IP, please try again after sometime!',
  });
  return res.json(returnObj);
}

// Limit requests from same API
export const OTPLimiter = rateLimit({
  max: 10,
  windowMs: 60 * 5 * 1000,
  handler: function (req, res) {
    return rateLimitMessage(req, res);
  },
});

// Limit requests from same API
const defaultLimiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  handler: function (req, res) {
    return rateLimitMessage(req, res);
  },
});

export default defaultLimiter;
