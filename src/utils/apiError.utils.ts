import http from 'http';

class ApiError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;
    errors?: any[];

    constructor(statusCode: number, message: string, errors?: any[]) {
        super(message);
        this.statusCode = statusCode;
        
        this.status = http.STATUS_CODES[statusCode] || 'Unknown Status';
        this.isOperational = true;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError; 