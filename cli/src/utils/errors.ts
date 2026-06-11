import chalk from 'chalk';
import axios from 'axios';
import { ERROR_CODES, ERROR_MESSAGES, ErrorCode } from '../constants/index.js';
import { logger } from './logger.js';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly cause?: unknown;
  public readonly timestamp: Date;

  constructor(code: ErrorCode, message?: string, cause?: unknown) {
    super(message || ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN]);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
    this.timestamp = new Date();
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) return error;

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        return new AppError(ERROR_CODES.UNAUTHORIZED, undefined, error);
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return new AppError(ERROR_CODES.NETWORK_TIMEOUT, undefined, error);
      }
      return new AppError(ERROR_CODES.API_FAILED, error.response?.data?.message || error.message, error);
    }

    if (error instanceof Error) {
      return new AppError(ERROR_CODES.UNKNOWN, error.message, error);
    }

    return new AppError(ERROR_CODES.UNKNOWN, String(error), error);
  }

  toString(): string {
    return `[${this.code}] ${this.message}`;
  }
}

export function handleError(error: unknown): void {
  const appError = AppError.fromUnknown(error);

  logger.error(`${chalk.bold(appError.code)}: ${appError.message}`);

  if (appError.cause instanceof Error) {
    logger.debug(`原始错误: ${appError.cause.stack || appError.cause.message}`);
  }
}

export function printApiError(error: unknown): void {
  handleError(error);
}

export function throwApiError(error: unknown): never {
  throw AppError.fromUnknown(error);
}

export function validateParam(value: unknown, name: string): void {
  if (value === undefined || value === null || value === '') {
    throw new AppError(ERROR_CODES.INVALID_PARAMS, `参数 ${name} 不能为空`);
  }
}
