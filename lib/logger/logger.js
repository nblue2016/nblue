const fs = require('fs');

const levelOfError = 1;
const levelOfWarning = 2;
const levelOfInfo = 3;
const levelOfVerbose = 4;

const DEFAULT_LOG_LEVEL = levelOfInfo;
const DEFAULT_APP_NAME = 'defaultAppName';
const DEFAULT_LINE_FORMAT = '[${level}] ${now}: ${message}';

class Logger {

  constructor(outputter, options) {
    this._outputter = outputter ? outputter : Logger.createConsoleOutputter();

    const opts = options || {};

    this._appName = opts.app || DEFAULT_APP_NAME;
    this._lineFormat = opts.lineFormat || DEFAULT_LINE_FORMAT;
    this._debugMode = opts.debugMode || false;

    this._logLevels = new Map();
    this._logLevels.set(this._appName, opts.logLevel || DEFAULT_LOG_LEVEL);
  }

  get DebugMode() {
    return this._debugMode;
  }
  set DebugMode(val) {
    this._debugMode = val;
  }

  get AppName() {
    return this._appName;
  }
  set AppName(val) {
    const level = this.getLogLevel(val);

    this._appName = val;

    this.setLogLevel(val, level);
  }

  get LineFormat() {
    return this._lineFormat;
  }
  set LineFormat(val) {
    this._lineFormat = val;
  }

  get Level() {
    return this.getLogLevel(this._appName);
  }
  set Level(val) {
    this.setLogLevel(this._appName, val);
  }

  getLogLevel(appName) {
    if (this._logLevels.has(appName)) {
      return this._logLevels.get(appName);
    }

    if (this._logLevels.has(DEFAULT_APP_NAME)) {
      return this._logLevels.get(DEFAULT_APP_NAME);
    }

    return DEFAULT_LOG_LEVEL;
  }
  setLogLevel(appName, level) {
    this._logLevels.set(appName, level);
  }

  error(message, appName) {
    this.log(levelOfError, message, appName);
  }

  warning(message, appName) {
    this.log(levelOfWarning, message, appName);
  }

  info(message, appName) {
    this.log(levelOfInfo, message, appName);
  }

  verbose(message, appName) {
    this.log(levelOfVerbose, message, appName);
  }

  debug(message, appName) {
    if (this.DebugMode) this.info(message, appName);
  }

  module(appName) {
    const options = {
      app: appName,
      debugMode: this.DebugMode,
      lineFormat: this.LineFormat,
      logLevel: this.getLogLevel(appName)
    };

    const logger = new Logger(this._outputter, options);

    logger.log = this.log;

    return logger;
  }

  log(level, message, options) {
    let appName = this.AppName,
        args = null;

    if (options) {
      if (typeof options === 'string') {
        appName = options;
      } else if (typeof options === 'object') {
        if (options.appName) appName = options.appName;
        if (options.app) appName = options.app;

        args = options;
      }
    }

    const currentLevel = this.getLogLevel(appName);

    if (level <= currentLevel) {
      const items = {
        now: this.getTimespanFormat(Date.now()),
        level: this.getLevelText(level),
        message: this.getMessageText(message),
        app: appName
      };

      this.logLine(String.format(this.LineFormat, items));

      this.logMore(args, items);
    }
  }

  logLine(line) {
    if (!this._outputter.log) return;

    if (line) this._outputter.log(line);
  }

  logMore(args, items) {
    if (this._outputter.logMore && args) {
      this._outputter.logMore(args, items);
    }
  }

  getTimespanFormat(timeSpan) {
    return new Date(timeSpan).format('MM/dd/yyyy HH:mm:ss');
  }

  getLevelText(level) {
    switch (level) {
      case levelOfError:
        return 'Error';
      case levelOfWarning:
        return 'Warning';
      case levelOfVerbose:
        return 'Verbose';
      case levelOfInfo:
      default:
        return 'Info';
    }
  }

  getMessageText(message) {
    return message;
  }

  static createConsoleOutputter() {
    return console;
  }

  static createMemoryOutputter() {
    let buffer = [];

    const bufferOutputter = function () {
      return {
        log: line => buffer.push(line),
        toArray: () => buffer,
        toString: () => buffer.join('\r\n'),
        clear: () => {
          buffer = [];
        }
      };
    };

    return bufferOutputter();
  }

  static createFileOutputter(logFile) {
    const opts = { encoding: 'utf-8' };

    const cb = err => {
      if (err) throw err;
    };

    const fileOutputter = function (file) {
      return {
        log: line => {
          fs.appendFile(file, `${line}\r\n`, opts, cb);
        }
      };
    };

    return fileOutputter(logFile);
  }

}

module.exports = Logger;