import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '@/types/user.types';
import { 
    ACCESS_TOKEN_SECRET, 
    REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY 
} from '@/config/env.config';

interface TokenPayload {
    userId: string;
    email: string;
    accountType: string;
}

interface VerificationTokenPayload {
    userId: string;
    type: 'email';
}

// Generate Access Token
export const generateAccessToken = (user: IUser): string => {
    const payload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        accountType: user.accountType
    };

    const options: SignOptions = {
        expiresIn: ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn']
    };

    return jwt.sign(
        payload,
        ACCESS_TOKEN_SECRET,
        options
    );
};

// Generate Verification Token //--> for email verification
// export const generateVerificationToken = (payload: VerificationTokenPayload): string => {
//     const options: SignOptions = {
//         expiresIn: '1h'
//     };

//     return jwt.sign(
//         payload,
//         ACCESS_TOKEN_SECRET,
//         options
//     );
// };



// Generate Refresh Token
export const generateRefreshToken = (user: IUser): string => {
    const payload: Pick<TokenPayload, 'userId'> = {
        userId: user._id.toString()
    };

    const options: SignOptions = {
        expiresIn: REFRESH_TOKEN_EXPIRY as jwt.SignOptions['expiresIn']
    };

    return jwt.sign(
        payload,
        REFRESH_TOKEN_SECRET,
        options
    );
};





// Verify Access Token -->
// export const verifyAccessToken = (token: string): TokenPayload => {
//     try {
//         return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
//     } catch (error) {
//         throw new Error('Invalid access token');
//     }
// };





// Verify Verification Token--> verification for email
// export const verifyVerificationToken = (token: string): VerificationTokenPayload => {
//     try {
//         return jwt.verify(token, ACCESS_TOKEN_SECRET) as VerificationTokenPayload;
//     } catch (error) {
//         throw new Error('Invalid verification token');
//     }
// };




// Verify Refresh Token-->
export const verifyRefreshToken = (token: string): Pick<TokenPayload, 'userId'> => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET) as Pick<TokenPayload, 'userId'>;
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};





// Generate both tokens
export const generateTokens = (user: IUser) => {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user)
    };
};


