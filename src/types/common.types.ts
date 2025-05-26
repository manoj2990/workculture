
export interface User {
    id: string;
    email: string;
    password: string;
    accountType: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: Omit<User, 'password'>;
}

export type accountType = 'superadmin' | 'admin' | 'employee' | 'individual'; 