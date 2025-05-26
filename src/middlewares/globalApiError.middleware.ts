import { Request, Response, NextFunction } from 'express';
import http from 'http';
import ApiResponse from '@/utils/apiResponse.utils';

interface ErrorWithStatus extends Error {
    statusCode?: number;
    errors?: Record<string, { message: string }>;
}

const globalApiErrorHandler = (
    err: ErrorWithStatus,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode = err.statusCode || 500;
    let status = http.STATUS_CODES[statusCode] || 'Unknown Status';
    let message = err.message || "Internal Server Error";

    // Handle Mongoose errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        status = http.STATUS_CODES[400] || 'Bad Request';
        message = Object.values(err.errors || {}).map(val => val.message).join(', ');
    }

    const response = new ApiResponse(
        statusCode,
        null,
        message
    );

    // Override status if needed
    response.status = status;

    console.error(`[${new Date().toISOString()}]`, {
        statusCode,
        status,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    response.send(res);
};

export default globalApiErrorHandler; 