/**
 * Níveis de log suportados pelo logger
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Interface para serviços de logging
 */
export interface LoggingService {
  log(level: LogLevel, message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
  fatal(message: string, error?: Error, meta?: Record<string, any>): void;
}

/**
 * Configuração do logger
 */
interface LoggerConfig {
  /**
   * Se o logging está habilitado
   * @default true
   */
  enabled: boolean;
  
  /**
   * Nível mínimo de log a ser registrado
   * @default 'debug'
   */
  minLevel: LogLevel;
  
  /**
   * Se deve incluir timestamp nas mensagens
   * @default true
   */
  includeTimestamp: boolean;
  
  /**
   * Se deve registrar logs no console
   * @default true em desenvolvimento, false em produção
   */
  consoleOutput: boolean;
}

// Configuração padrão
const defaultConfig: LoggerConfig = {
  enabled: true,
  minLevel: 'debug',
  includeTimestamp: true,
  consoleOutput: process.env.NODE_ENV !== 'production'
};

// Mapeamento de níveis de log para métodos do console
const LOG_LEVEL_METHODS: Record<LogLevel, keyof Console> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'error'
};

// Ordem dos níveis para comparação
const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

/**
 * Implementação do logger para o aplicativo
 */
class AppLogger implements LoggingService {
  private config: LoggerConfig;
  
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * Determina se um nível de log deve ser registrado com base na configuração
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVEL_SEVERITY[level] >= LOG_LEVEL_SEVERITY[this.config.minLevel];
  }
  
  /**
   * Registra uma mensagem com o nível especificado
   */
  public log(level: LogLevel, message: string, meta: Record<string, any> = {}): void {
    if (!this.shouldLog(level)) return;
    
    const timestamp = this.config.includeTimestamp ? new Date().toISOString() : undefined;
    const logData = {
      level,
      message,
      ...(timestamp ? { timestamp } : {}),
      ...meta
    };
    
    // Output para console em desenvolvimento
    if (this.config.consoleOutput) {
      const consoleMethod = LOG_LEVEL_METHODS[level];
      console[consoleMethod](`[${level.toUpperCase()}]${timestamp ? ` [${timestamp}]` : ''}: ${message}`, meta);
    }
    
    // Aqui você pode integrar com serviços de monitoramento como Sentry, LogRocket, etc.
    this.sendToExternalService(logData);
  }
  
  /**
   * Registra uma mensagem de nível debug
   */
  public debug(message: string, meta: Record<string, any> = {}): void {
    this.log('debug', message, meta);
  }
  
  /**
   * Registra uma mensagem de nível info
   */
  public info(message: string, meta: Record<string, any> = {}): void {
    this.log('info', message, meta);
  }
  
  /**
   * Registra uma mensagem de nível warn
   */
  public warn(message: string, meta: Record<string, any> = {}): void {
    this.log('warn', message, meta);
  }
  
  /**
   * Registra uma mensagem de nível error
   */
  public error(message: string, error?: Error, meta: Record<string, any> = {}): void {
    const errorMeta = error ? {
      ...meta,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : meta;
    
    this.log('error', message, errorMeta);
  }
  
  /**
   * Registra uma mensagem de nível fatal
   */
  public fatal(message: string, error?: Error, meta: Record<string, any> = {}): void {
    const errorMeta = error ? {
      ...meta,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : meta;
    
    this.log('fatal', message, errorMeta);
  }
  
  /**
   * Envia logs para serviços externos (implementação fictícia)
   */
  private sendToExternalService(logData: any): void {
    // Implementação para enviar dados para serviços como Sentry, LogRocket, etc.
    // Exemplo:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureMessage(logData.message, {
    //     level: logData.level,
    //     extra: logData
    //   });
    // }
  }
  
  /**
   * Atualiza a configuração do logger
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Instância singleton do logger
export const logger = new AppLogger();

/**
 * Wrapper para tratamento de erros em funções assíncronas
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage = 'Erro na operação assíncrona'
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(errorMessage, error instanceof Error ? error : new Error(String(error)), {
        functionName: fn.name,
        arguments: args
      });
      throw error;
    }
  };
} 