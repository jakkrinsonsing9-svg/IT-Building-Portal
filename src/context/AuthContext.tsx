import React, { createContext, useContext, useState, useEffect } from 'react';
import { MaskedUserView } from '../types/index.ts';

interface AuthContextType {
  user: MaskedUserView | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    studentOrStaffId: string;
    citizenId: string;
    phone: string;
    department?: string;
    requestedRole?: 'user' | 'admin';
    adminPasscode?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchDemoAccount: (roleOrEmail: 'admin' | string) => Promise<void>;
  unmaskedPII: boolean;
  toggleUnmaskPII: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MaskedUserView | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('it_portal_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [unmaskedPII, setUnmaskedPII] = useState<boolean>(false);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('it_portal_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('it_portal_token');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Failed to restore session', err);
        localStorage.removeItem('it_portal_token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'เข้าสู่ระบบไม่สำเร็จ' };
      }

      localStorage.setItem('it_portal_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    studentOrStaffId: string;
    citizenId: string;
    phone: string;
    department?: string;
    requestedRole?: 'user' | 'admin';
    adminPasscode?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'ลงทะเบียนไม่สำเร็จ' };
      }

      localStorage.setItem('it_portal_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
    }
  };

  const logout = () => {
    localStorage.removeItem('it_portal_token');
    setToken(null);
    setUser(null);
    setUnmaskedPII(false);
  };

  const switchDemoAccount = async (target: 'admin' | string) => {
    if (target === 'admin') {
      await login('admin@it.ac.th', 'Admin@Pass1234');
    }
  };

  const toggleUnmaskPII = () => {
    setUnmaskedPII((prev) => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoAccount,
        unmaskedPII,
        toggleUnmaskPII,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
