import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

const LOG_LEVEL_STYLES: Record<LogLevel, (text: string) => string> = {
  debug: chalk.gray,
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  success: chalk.green,
};

const LOG_PREFIX: Record<LogLevel, string> = {
  debug: '[DEBUG]',
  info: '[INFO]',
  warn: '[WARN]',
  error: '[ERROR]',
  success: '[OK]',
};

let currentLogLevel: LogLevel = 'info';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  success: 4,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
}

function formatMessage(level: LogLevel, message: string): string {
  const style = LOG_LEVEL_STYLES[level];
  const prefix = LOG_PREFIX[level];
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return `${chalk.gray(timestamp)} ${style(prefix)} ${message}`;
}

export const logger = {
  setLevel(level: LogLevel): void {
    currentLogLevel = level;
  },

  debug(message: string, ...args: unknown[]): void {
    if (!shouldLog('debug')) return;
    console.log(formatMessage('debug', message), ...args);
  },

  info(message: string, ...args: unknown[]): void {
    if (!shouldLog('info')) return;
    console.log(formatMessage('info', message), ...args);
  },

  warn(message: string, ...args: unknown[]): void {
    if (!shouldLog('warn')) return;
    console.warn(formatMessage('warn', message), ...args);
  },

  error(message: string, ...args: unknown[]): void {
    if (!shouldLog('error')) return;
    console.error(formatMessage('error', message), ...args);
  },

  success(message: string, ...args: unknown[]): void {
    if (!shouldLog('success')) return;
    console.log(formatMessage('success', message), ...args);
  },

  print(title: string, content: string): void {
    console.log(`${chalk.cyan(`[${title}]`)} ${content}`);
  },

  blank(): void {
    console.log('');
  },

  divider(title?: string): void {
    const width = 60;
    if (title) {
      const padding = Math.floor((width - title.length - 2) / 2);
      const line = '─'.repeat(Math.max(0, padding));
      console.log(chalk.cyan(`${line} ${title} ${line}`));
    } else {
      console.log(chalk.cyan('─'.repeat(width)));
    }
  },
};
