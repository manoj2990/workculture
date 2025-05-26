import http from 'http';
import { Response } from 'express';

interface ApiResponseData {
    success: boolean;
    statusCode: number;
    status: string;
    message: string;
    data: any;
    timestamp: string;
}

class ApiResponse {
    statusCode: number;
    status: string;
    data: any;
    message: string;
    success: boolean;
    timestamp: string;

    constructor(statusCode: number, data: any = null, message: string = http.STATUS_CODES[statusCode] || 'Unknown Status') {
        this.statusCode = statusCode;
        this.status = http.STATUS_CODES[statusCode] || 'Unknown Status';
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
        this.timestamp = new Date().toISOString();
    }

    send(res: Response): Response {
        const responseData: ApiResponseData = {
            success: this.success,
            statusCode: this.statusCode,
            status: this.status,
            message: this.message,
            data: this.data,
            timestamp: this.timestamp
        };

        return res.status(this.statusCode).json(responseData);
    }
}

export default ApiResponse; 