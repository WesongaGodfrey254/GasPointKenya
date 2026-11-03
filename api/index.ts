import 'dotenv/config';
import express from 'express';
import { apiRouter } from '../src/server/api.ts';

const app = express();
app.use(express.json());

// Support both /api/* requests and rewritten routes
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
