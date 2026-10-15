import React, { createContext, useContext, useState, useEffect } from 'react';
import { MaskedUserView } from '../types/index.ts';
import { clientStorage } from '../services/clientStorage.ts';

interface LoginResult {
  success: boolean;
  requireOtp?: boolean;
  email?: string;
  maskedEmail?: string;
  devOtpCode?: string;
  error?: string;
}

interface AuthContextType {
  user: MaskedUserView | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, require2FA?: boolean) => Promise<LoginResult>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; devOtpCode?: string; message?: string; error?: string }>;
  forgotPassword: (email: string) => Promise<{
    success: boolean;
    maskedEmail?: string;
    emailMode?: 'smtp' | 'simulated';
    isSmtpConfigured?: boolean;
    message?: string;
    otpCode?: string;
    error?: string;
  }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
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

      // Check if this was a local offline token
      if (storedToken.startsWith('local-token-')) {
        const parts = storedToken.split('-');
        const userId = `${parts[2]}-${parts[3] || ''}`;
        const localUser = clientStorage.getUserById(userId);
        if (localUser) {
          setUser(localUser);
          setToken(storedToken);
          setLoading(false);
          return;
        }
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          setUser(data.user);
          setToken(storedToken);
          clientStorage.saveUserSync(data.user);
        } else {
          // Check local storage before clearing
          const localUser = clientStorage.getUserById(storedToken);
          if (localUser) {
            setUser(localUser);
          } else {
            localStorage.removeItem('it_portal_token');
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.warn('Backend session restore fallback to local storage:', err);
        // Try to maintain session if available in client storage
        const allUsers = clientStorage.getRooms(); // touch clientStorage
        const savedUserStr = localStorage.getItem('it_current_user');
        if (savedUserStr) {
          try {
            setUser(JSON.parse(savedUserStr));
          } catch {
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email: string, password: string, require2FA: boolean = true): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, require2FA }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'เข้าสู่ระบบไม่สำเร็จ' };
        }

        if (data.requireOtp) {
          return {
            success: true,
            requireOtp: true,
            email: data.email,
            maskedEmail: data.maskedEmail,
            devOtpCode: data.devOtpCode,
          };
        }

        localStorage.setItem('it_portal_token', data.token);
        localStorage.setItem('it_current_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        clientStorage.saveUserSync(data.user);
        return { success: true };
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch (err) {
      console.warn('Server unavailable for login, falling back to client storage:', err);
      const localResult = clientStorage.loginUser(email, password, require2FA);
      if (localResult.success && localResult.token && localResult.user) {
        localStorage.setItem('it_portal_token', localResult.token);
        localStorage.setItem('it_current_user', JSON.stringify(localResult.user));
        setToken(localResult.token);
        setUser(localResult.user);
      }
      return localResult;
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'รหัส OTP ไม่ถูกต้อง' };
        }

        localStorage.setItem('it_portal_token', data.token);
        localStorage.setItem('it_current_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        clientStorage.saveUserSync(data.user);
        return { success: true };
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch (err) {
      console.warn('Server unavailable for OTP verify, falling back to client storage:', err);
      const localRes = clientStorage.verifyOtp(email, otp);
      if (localRes.success && localRes.token && localRes.user) {
        localStorage.setItem('it_portal_token', localRes.token);
        localStorage.setItem('it_current_user', JSON.stringify(localRes.user));
        setToken(localRes.token);
        setUser(localRes.user);
      }
      return localRes;
    }
  };

  const resendOtp = async (email: string) => {
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'ส่ง OTP ไม่สำเร็จ' };
        }

        return { success: true, devOtpCode: data.devOtpCode, message: data.message };
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch (err) {
      console.warn('Server unavailable for resend OTP, falling back to client storage:', err);
      return clientStorage.resendOtp(email);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'ขอรีเซ็ตรหัสผ่านไม่สำเร็จ' };
        }
        return {
          success: true,
          maskedEmail: data.maskedEmail,
          emailMode: data.emailMode,
          isSmtpConfigured: data.isSmtpConfigured,
          message: data.message,
          otpCode: data.otpCode,
        };
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch (err) {
      console.warn('Server unavailable for forgot password, falling back to client storage:', err);
      return clientStorage.forgotPassword(email);
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'รีเซ็ตรหัสผ่านไม่สำเร็จ' };
        }
        return { success: true, message: data.message };
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch (err) {
      console.warn('Server unavailable for reset password, falling back to client storage:', err);
      return clientStorage.resetPassword(email, otp, newPassword);
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

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'ลงทะเบียนไม่สำเร็จ' };
        }

        localStorage.setItem('it_portal_token', data.token);
        localStorage.setItem('it_current_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        clientStorage.saveUserSync(data.user);
        return { success: true };
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch (err) {
      console.warn('Server unavailable for register, falling back to secure client storage with Bcrypt:', err);
      const localResult = clientStorage.registerUser(userData);
      if (localResult.success && localResult.token && localResult.user) {
        localStorage.setItem('it_portal_token', localResult.token);
        localStorage.setItem('it_current_user', JSON.stringify(localResult.user));
        setToken(localResult.token);
        setUser(localResult.user);
      }
      return localResult;
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
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
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
