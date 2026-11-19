import React, { createContext, useContext, useState } from 'react';

interface User {
  name: string;
  email?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  loginWithPhone: (phone: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Existing email/password login
  const login = (email: string, password: string) => {
    if (
      email.trim().toLowerCase() === 'demo@sports.com' &&
      password === '123456'
    ) {
      setUser({
        name: 'Rahman',
        email: 'demo@sports.com',
      });

      return true;
    }

    return false;
  };

  // Mobile OTP login
  const loginWithPhone = (phone: string) => {
    if (!/^[0-9]{10}$/.test(phone)) {
      return false;
    }

    setUser({
      name: 'GMR User',
      phone,
    });

    return true;
  };

  // Existing signup
  const signup = (name: string, email: string, password: string) => {
    if (
      name.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 6
    ) {
      return false;
    }

    setUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });

    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithPhone,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
