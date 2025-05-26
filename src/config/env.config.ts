import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
    MONGODB_URI: string;
    PORT: string;
    NODE_ENV: string;
    ACCESS_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRY: string;
    CORS_ORIGIN: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    REFRESH_TOKEN_EXPIRY: string;
    MAIL_HOST: string;
    MAIL_USER: string;
    MAIL_PASS: string;
    FRONTEND_URL: string;
    JWT_SECRET: string;
    endpoint: string;
    modelName:string;
    deployment:string;
    apiKey:string;
    apiVersion:string;
    subscriptionKey:string;
    serviceRegion:string;
}

const env: EnvConfig = {
    MONGODB_URI: process.env.MONGODB_URI || '',
    PORT: process.env.PORT || '5000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    MAIL_HOST: process.env.MAIL_HOST || '',
    MAIL_USER: process.env.MAIL_USER || '',
    MAIL_PASS: process.env.MAIL_PASS || '',
    FRONTEND_URL: process.env.FRONTEND_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret',
    endpoint: process.env.endpoint  || '',
    modelName:process.env.modelName  || '',
    deployment:process.env.deployment  || '',
    apiKey:process.env.apiKey || '',
    apiVersion:process.env.apiVersion  || '',
    subscriptionKey:process.env.subscriptionKey || '',
    serviceRegion:process.env.serviceRegion || ''
};

export const {
    MONGODB_URI,
    PORT,
    NODE_ENV,
    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY,
    CORS_ORIGIN,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY,
    MAIL_HOST,
    MAIL_USER,
    MAIL_PASS,
    FRONTEND_URL,
    JWT_SECRET,
    endpoint,
    modelName,
    deployment,
    apiKey,
    apiVersion,
    serviceRegion,
    subscriptionKey
} = env; 