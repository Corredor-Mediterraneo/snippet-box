type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'DEV';

export class Logger {
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  public info(message: string): void {
    this.log(message, 'INFO');
  }

  public warn(message: string): void {
    this.log(message, 'WARN');
  }

  public error(message: string): void {
    this.log(message, 'ERROR');
  }

  public debug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      this.log(message, 'DEBUG');
    }
  }

  public dev(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      this.log(message, 'DEV');
    }
  }

  public log(message: string, level: LogLevel = 'INFO'): void {
    const timestamp = this.generateTimestamp();

    if (level === 'ERROR') {
      console.error(`[${timestamp}] [${level}] ${this.namespace}: ${message}`);
    } else if (level === 'WARN') {
      console.warn(`[${timestamp}] [${level}] ${this.namespace}: ${message}`);
    } else {
      console.log(`[${timestamp}] [${level}] ${this.namespace}: ${message}`);
    }
  }

  private generateTimestamp(): string {
    const d = new Date();
    return d.toISOString();
  }
}
