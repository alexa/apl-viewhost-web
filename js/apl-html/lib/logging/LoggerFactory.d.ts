import { ILogger } from './ILogger';
import { LogLevel } from './LogLevel';
import { LogTransport } from './LogTransport';
/**
 * Simple wrapper to hide loglevel logger oddity and do set-up. Could be changed to be more generic in the future.
 */
export declare class LoggerFactory {
    private static rootLogger;
    private static originalFactory;
    private static initialized;
    /**
     * Initialize logger
     *
     * @param logLevel one of 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'
     * @param transport optional parameter for custom log transport. @see LogTransport
     */
    static initialize(logLevel: LogLevel, transport?: LogTransport): void;
    /**
     * Creates component specific logger.
     *
     * @param name Name of the requesting component.
     */
    static getLogger(name: string): ILogger;
}
