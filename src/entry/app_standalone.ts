import * as os from 'os';
import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as morgan from 'morgan';
import './bootstrap';
import config from '../config';
import logger, { morganStreamWriter } from '../logger';
import { connectDatabase } from '../mongoose';
import api from '../api';
import converterQueue from '../converter/queue';

// -- STANDALONE MODE (part 2) --
// When using Chuck in standalone mode, we first load the required plugins (in part 1, ./standalone.ts)
// The part 2 (current file) takes care of running the server and importing ./bootstrap to get error reporting

//=> Resume the conversions queue
converterQueue.resume().catch((error) => {
    logger.error(error.message);
    process.exit(1);
});

//=> Create an Express app
const app = express();
const port = config.serverPort;

//=> Load the view engine Pug
app.set('view engine', 'pug');
app.set('views', path.resolve(`${__dirname}/..`));

//=> Connect to the MongoDB database
connectDatabase(config.mongoUrl).catch((error) => {
    logger.error(error.message);
    process.exit(1);
});

//=> Enable CORS
app.use(cors());

//=> Logging of HTTP requests with morgan
const morganFormat = config.env == 'production'
    ? ':remote-addr - :method :url [:status], resp. :response-time ms, :res[content-length] bytes, referrer ":referrer"'
    : 'dev';

app.use(morgan(morganFormat, { stream: morganStreamWriter }));

//=> Decode JSON request bodies
app.use(
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true })
);

//=> Mount the API
app.use('/api', api);

if (config.adminWebUis.enable) {
    // Load web uis on-demand with require()
    // tslint:disable-next-line:no-var-requires
    app.use(require('../web_uis').default);
}

//=> Start the HTTP server
app.listen(port, () => {
    logger.info(`🌍 Up and running @ http://${os.hostname()}:${port}`);
    logger.info(`Running for env: ${config.env}`);
});
