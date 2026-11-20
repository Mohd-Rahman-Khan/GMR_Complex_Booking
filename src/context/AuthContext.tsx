import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';

const AUTH_TOKEN_KEY = '@sportsarena_auth_token';

export interface User {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  complexId?: string | null;
  profileImage?: string;
}

interface OtpResponse {
  success?: boolean;
  message?: string;
  data?: {
    devOtp?: string | number;
  };
}

interface VerifyOtpResponse {
  success?: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: User;
  };
}

interface RegisterAdminResponse {
  success?: boolean;
  message?: string;
  data?: {
    id?: string;
    name?: string;
    phone?: string;
    role?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isInitializing: boolean;

  requestOtp: (phone: string) => Promise<string | undefined>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;

  registerAdmin: (name: string, phone: string, email: string) => Promise<void>;

  logout: () => Promise<void>;

  login: (email: string, password: string) => boolean;
  loginWithPhone: (phone: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getDevOtp = (response: OtpResponse) => {
  const otp = response?.data?.devOtp;
  return otp ? String(otp) : undefined;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // SAVE LOGIN SESSION
  const saveSession = async (response: VerifyOtpResponse) => {
    const receivedToken = response?.data?.token;
    const loggedInUser = response?.data?.user;

    if (!receivedToken || !loggedInUser) {
      throw new Error('Token or user details missing in server response.');
    }

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, receivedToken);

    setToken(receivedToken);

    setUser({
      id: loggedInUser.id,
      name: loggedInUser.name || 'SportsArena User',
      email: loggedInUser.email,
      phone: loggedInUser.phone,
      role: loggedInUser.role,
      complexId: loggedInUser.complexId,
      profileImage: loggedInUser.profileImage,
    });
  };

  // RESTORE SAVED SESSION
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

        if (!savedToken) return;

        const response: any = await apiRequest('/auth/me', {
          method: 'GET',
          token: savedToken,
        });

        const responseData = response?.data ?? response;
        const loggedInUser = responseData?.user ?? responseData;

        if (!loggedInUser?.phone) {
          throw new Error('Invalid user session.');
        }

        setToken(savedToken);

        setUser({
          id: loggedInUser.id ?? loggedInUser._id,
          name: loggedInUser.name || 'SportsArena User',
          email: loggedInUser.email,
          phone: loggedInUser.phone,
          role: loggedInUser.role,
          complexId: loggedInUser.complexId,
          profileImage: loggedInUser.profileImage,
        });
      } catch (error) {
        console.log('Session restore failed:', error);
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, []);

  // COMMON OTP REQUEST
  // Customer + Complex Admin + Sport Admin
  const requestOtp = async (phone: string) => {
    if (!/^[0-9]{10}$/.test(phone)) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const response = await apiRequest<OtpResponse>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });

    return getDevOtp(response);
  };

  // COMMON OTP VERIFICATION
  // Customer + Complex Admin + Sport Admin
  const verifyOtp = async (phone: string, otp: string) => {
    if (!/^[0-9]{10}$/.test(phone)) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      throw new Error('Please enter a valid 6-digit OTP.');
    }

    const response = await apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });

    await saveSession(response);
  };

  // SEPARATE COMPLEX ADMIN REGISTRATION
  const registerAdmin = async (name: string, phone: string, email: string) => {
    if (!name.trim()) {
      throw new Error('Please enter your name.');
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const response = await apiRequest<RegisterAdminResponse>(
      '/auth/register-admin',
      {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone,
          email: email.trim() || undefined,
        }),
      },
    );

    if (response?.success === false) {
      throw new Error(response.message || 'Admin registration failed.');
    }
  };

  // LOGOUT
  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // OLD LOCAL LOGIN METHODS DISABLED
  const login = (_email: string, _password: string) => false;

  const loginWithPhone = (_phone: string) => false;

  const signup = (_name: string, _email: string, _password: string) => false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isInitializing,
        requestOtp,
        verifyOtp,
        registerAdmin,
        logout,
        login,
        loginWithPhone,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
};
