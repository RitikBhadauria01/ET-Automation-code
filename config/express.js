import bodyParser from 'body-parser';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import methodOverride from 'method-override';
import path from 'path';

import xss from 'xss-clean';
import hpp from 'hpp';
import multer from 'multer';
import AppError from '../server/helpers/AppError';
import logger from '../server/helpers/logger';
import routes from '../server/routes';
import globalErrorHandler from '../server/helpers/errorHandler';

let upload = multer({ dest: 'uploads/' })

const app = express();
const server = require('http').createServer(app); // eslint-disable-line


// To make the photos public
app.use(express.static('upload'));

// mount assets folder on / path
app.use('/node', express.static(path.resolve(__dirname, '../../node/'))); // eslint-disable-line

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

app.use(cookieParser());
app.use(compress());
app.use(methodOverride());


// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

morgan.token('app_id', function (req, res) {
  return req.headers['app_id'];
});

app.use(
  morgan(
    '{"Date": ":date[clf]", "Method": ":method", "URL": ":url", "app_id":":app_id", "http_version": ":http-version", "status": ":status", "result_length": ":res[content-length]", "referrer": ":referrer", "user_agent": ":user-agent", "response_time": ":response-time", "remote_addr": ":remote-addr", "remote_user": ":remote-user"}',
    { stream: logger.stream }
  )
);

// mount all routes on /api path
app.use('/node/api', routes);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use((err, req, res, next) => globalErrorHandler(err, req, res, next));

export default server;
