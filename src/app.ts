import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from '@/routes';
import globalErrorHandler from '@/middlewares/globalApiError.middleware';
import path from 'path';
const app: Application = express();

// Middleware
// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }));

app.use(
  cors({
    origin: ['http://127.0.0.1:8080','http://127.0.0.1:5500/','*'],
    credentials: true,
  })
);
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

app.use('/api/v1/audio', express.static(path.join(__dirname, '..', 'public', 'audio')));

// Routes
routes(app);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use(globalErrorHandler);

export default app; 