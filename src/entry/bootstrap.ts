import * as raven from 'raven';
import * as sourceMapSupport from 'source-map-support';
import config from '../config';
import logger from '../logger';

sourceMapSupport.install();

// Configure the error reporting
config.ravenDsn && raven.config(config.ravenDsn, {
    release: config.release,
    environment: config.env
}).install();

// Make sure no error goes silent
process.on('unhandledRejection', (reason: any): void => {
    logger.error('UNHANDLED REJECTION', reason);
});

process.on('uncaughtException', (err: any): void => {
    logger.error('UNCAUGHT EXCEPTION', err);
});
