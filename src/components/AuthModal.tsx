import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  CreditCard,
  School,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Sparkles,
  Eye,
  EyeOff,
  AlertTriangle,
  Copy,
  Check,
  Inbox
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, verifyOtp, resendOtp, forgotPassword, resetPassword, switchDemoAccount } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 2FA OTP state for Login
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otpCode, setOtpCode] = useState('');
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [otpMaskedEmail, setOtpMaskedEmail] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [emailMode, setEmailMode] = useState<'smtp' | 'simulated'>('simulated');
  const [isSmtpConfigured, setIsSmtpConfigured] = useState<boolean>(false);
  const [mailboxModalOpen, setMailboxModalOpen] = useState(false);
  const [mailboxEmails, setMailboxEmails] = useState<any[]>([]);
  const [loadingMailbox, setLoadingMailbox] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  const fetchSimulatedEmails = async (targetEmail: string) => {
    setLoadingMailbox(true);
    try {
      const res = await fetch(`/api/auth/email-outbox-preview?email=${encodeURIComponent(targetEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setMailboxEmails(data.emails || []);
        setIsSmtpConfigured(Boolean(data.isSmtpConfigured));
      }
    } catch (err) {
      console.warn('Failed to fetch simulated emails:', err);
    } finally {
      setLoadingMailbox(false);
    }
  };

  const handleOpenSimulatedMailbox = () => {
    setMailboxModalOpen(true);
    fetchSimulatedEmails(forgotEmail.trim());
  };

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentOrStaffId, setStudentOrStaffId] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('สาขาวิทยาการคอมพิวเตอร์');
  const [requestedRole, setRequestedRole] = useState<'user' | 'admin'>('user');
  const [adminPasscode, setAdminPasscode] = useState('');

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resetAllFlows = () => {
    setStep('credentials');
    setMode('login');
    setForgotStep('request');
    setOtpCode('');
    setOtpTargetEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setDevOtpHint(null);
    setError(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    resetAllFlows();
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await login(email, password, false);
      if (res.success) {
        if (res.requireOtp) {
          // Switch to OTP step
          setStep('otp');
          setOtpTargetEmail(res.email || email);
          setOtpMaskedEmail(res.maskedEmail || email);
          if (res.devOtpCode) {
            setDevOtpHint(res.devOtpCode);
            setOtpCode(res.devOtpCode);
          }
          setResendCooldown(60);
          setSuccessMsg(`ระบบส่งรหัสยืนยัน OTP ไปยังอีเมล ${res.maskedEmail || email} เรียบร้อยแล้ว`);
        } else {
          setSuccessMsg('เข้าสู่ระบบสำเร็จ กำลังพาเข้าสู่ระบบ...');
          setTimeout(() => {
            handleClose();
          }, 400);
        }
      } else {
        setError(res.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await verifyOtp(otpTargetEmail, otpCode.trim());
      if (res.success) {
        setSuccessMsg('ยืนยันตัวตนสำเร็จ! กำลังเข้าสู่ระบบ...');
        setTimeout(() => {
          handleClose();
        }, 700);
      } else {
        setError(res.error || 'รหัส OTP ไม่ถูกต้อง');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !otpTargetEmail) return;
    setError(null);
    setLoading(true);
    try {
      const res = await resendOtp(otpTargetEmail);
      if (res.success) {
        setResendCooldown(60);
        setDevOtpHint(null);
        setOtpCode('');
        setSuccessMsg(res.message || 'ส่งรหัส OTP ใหม่อีกครั้งไปยังอีเมลจริงเรียบร้อย กรุณาเปิดกล่องจดหมาย');
      } else {
        setError(res.error || 'ส่ง OTP ไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await register({
        email,
        password,
        name,
        studentOrStaffId,
        citizenId,
        phone,
        department,
        requestedRole,
        adminPasscode: requestedRole === 'admin' ? adminPasscode : undefined,
      });
      if (res.success) {
        setSuccessMsg(`ลงทะเบียนสำเร็จในบทบาท [${requestedRole.toUpperCase()}] รหัสผ่านถูกเข้ารหัสด้วย Bcrypt เรียบร้อย`);
        setTimeout(() => {
          handleClose();
        }, 800);
      } else {
        setError(res.error || 'ลงทะเบียนไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Step 1 (Request OTP)
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('กรุณาระบุอีเมลที่ใช้ลงทะเบียน');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await forgotPassword(forgotEmail.trim());
      if (res.success) {
        setOtpMaskedEmail(res.maskedEmail || forgotEmail.trim());
        setEmailMode(res.emailMode || 'simulated');
        setIsSmtpConfigured(Boolean(res.isSmtpConfigured));
        setDevOtpHint(null);
        setForgotOtp('');
        setResendCooldown(60);
        setForgotStep('reset');
        setSuccessMsg(res.message || `ระบบได้ส่งรหัส OTP 6 หลักสำหรับรีเซ็ตรหัสผ่านไปยังอีเมล ${res.maskedEmail || forgotEmail.trim()} เรียบร้อยแล้ว กรุณาเปิดกล่องจดหมาย`);
      } else {
        setError(res.error || 'ไม่สามารถส่งรหัส OTP ได้');
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Direct Reset without OTP
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('กรุณากรอกอีเมลบัญชีของคุณ');
      return;
    }

    if (newPassword.length < 8) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await resetPassword(forgotEmail.trim(), 'DIRECT', newPassword);
      if (res.success) {
        setSuccessMsg('ตั้งรหัสผ่านใหม่สำเร็จเรียบร้อย! กำลังสลับไปหน้าเข้าสู่ระบบ...');
        setEmail(forgotEmail.trim());
        setPassword(newPassword);
        setTimeout(() => {
          setMode('login');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg(null);
        }, 1200);
      } else {
        setError(res.error || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (resendCooldown > 0 || !forgotEmail) return;
    setError(null);
    setLoading(true);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      if (res.success) {
        setResendCooldown(60);
        setDevOtpHint(null);
        setForgotOtp('');
        setSuccessMsg(`ส่งรหัส OTP ใหม่ไปยังอีเมลจริง ${res.maskedEmail || forgotEmail} เรียบร้อยแล้ว`);
      } else {
        setError(res.error || 'ขอรหัส OTP ไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (account: 'admin') => {
    setLoading(true);
    setError(null);
    try {
      // Demo accounts bypass 2FA for rapid testing
      const res = await login('admin@it.ac.th', 'Admin@Pass1234', false);
      if (res.success) {
        setSuccessMsg('เข้าสู่ระบบด่วนด้วยบัญชีแอดมินสำเร็จ');
        setTimeout(() => {
          handleClose();
        }, 500);
      } else {
        setError(res.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg glass-panel rounded-2xl p-6 sm:p-8 border border-white/15 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto z-10"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 mb-3 shadow-lg shadow-cyan-500/10">
            {step === 'otp' || mode === 'forgot' ? (
              <KeyRound className="w-6 h-6 text-amber-400" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'forgot'
              ? 'รีเซ็ตรหัสผ่าน (Reset Password)'
              : step === 'otp'
              ? 'พิสูจน์ตัวตน 2 ขั้นตอน (2FA OTP)'
              : mode === 'login'
              ? 'เข้าสู่ระบบ IT Building Portal'
              : 'สมัครสมาชิกผู้ใช้งานใหม่'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'forgot'
              ? forgotStep === 'request'
                ? 'กรอกอีเมลสถาบันเพื่อรับรหัส OTP 6 หลักสำหรับกู้คืนบัญชี'
                : 'กรอกรหัส OTP และตั้งรหัสผ่านใหม่ที่ต้องการ'
              : step === 'otp'
              ? 'กรุณากรอกรหัส OTP 6 หลักที่ระบบส่งไปยังอีเมลของคุณเพื่อยืนยันตัวตน'
              : 'ระบบยืนยันตัวตนพร้อมรหัส OTP 2FA, Password Hashing (Bcrypt) และ Data Masking'}
          </p>
        </div>

        {/* Mode Tabs - only show on credentials step when not in forgot password mode */}
        {step === 'credentials' && mode !== 'forgot' && (
          <div className="flex rounded-lg bg-slate-950/60 p-1 mb-5 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-cyan-500/30 text-white border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              เข้าสู่ระบบ (Sign In)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-cyan-500/30 text-white border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ลงทะเบียนใหม่ (Register)
            </button>
          </div>
        )}

        {/* Quick 1-Click Login Bar for testing & easy admin access */}
        {step === 'credentials' && mode === 'login' && (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs">
            <div className="text-[11px] text-slate-300 font-medium mb-1.5 flex items-center justify-between">
              <span>⚡ เลือกบัญชีเข้าสู่ระบบด่วน (1-Click Login):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('jakkrinsonsing1@gmail.com');
                  setPassword('Admin@Pass1234');
                  setError(null);
                }}
                className="py-2 px-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-[11px] text-cyan-200 text-left cursor-pointer transition-all flex items-center justify-between"
              >
                <span className="font-semibold truncate">👑 jakkrinsonsing1</span>
                <span className="text-[9px] bg-cyan-400/30 px-1.5 py-0.5 rounded font-mono text-cyan-300 font-bold">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@it.ac.th');
                  setPassword('Admin@Pass1234');
                  setError(null);
                }}
                className="py-2 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-[11px] text-amber-200 text-left cursor-pointer transition-all flex items-center justify-between"
              >
                <span className="font-semibold truncate">🛡️ admin@it.ac.th</span>
                <span className="text-[9px] bg-amber-400/30 px-1.5 py-0.5 rounded font-mono text-amber-300 font-bold">Admin</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VIEW 1: FORGOT PASSWORD FLOW (DIRECT RESET) */}
        {mode === 'forgot' ? (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/25 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                <KeyRound className="w-4 h-4" />
                <span>รีเซ็ตรหัสผ่านบัญชีของคุณ</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                ระบุอีเมลบัญชีของคุณและกำหนดรหัสผ่านใหม่ เพื่อเข้าสู่ระบบได้ทันที
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                อีเมลที่ใช้ลงทะเบียน *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="เช่น student@it.ac.th หรือ admin@it.ac.th"
                  className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>รหัสผ่านใหม่ (New Password) *</span>
                  <span className="text-[10px] text-slate-400">ขั้นต่ำ 8 ตัวอักษร</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full glass-input pl-9 pr-9 py-2 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ยืนยันรหัสผ่านใหม่ (Confirm Password) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20 border border-amber-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>กำลังบันทึกรหัสผ่าน...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกรหัสผ่านใหม่</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ย้อนกลับไปหน้าเข้าสู่ระบบ</span>
              </button>
            </div>
          </form>
        ) : (
          /* VIEW 2: CREDENTIALS FORM (LOGIN / REGISTER) */
          <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    ชื่อ-นามสกุลจริง (Full Name) *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น นายเอกชัย ไอทีศาสตร์"
                      className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      รหัสนักศึกษา / รหัสบุคลากร *
                    </label>
                    <div className="relative">
                      <School className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={studentOrStaffId}
                        onChange={(e) => setStudentOrStaffId(e.target.value)}
                        placeholder="เช่น 66014523"
                        className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      เลขประจำตัวประชาชน (13 หลัก) *
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        maxLength={13}
                        value={citizenId}
                        onChange={(e) => setCitizenId(e.target.value)}
                        placeholder="13 หลัก (ระบบจะเข้ารหัส Masking)"
                        className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      เบอร์โทรศัพท์ติดต่อ *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="เช่น 0812345678"
                        className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      สาขาวิชา / ภาควิชา
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="สาขาวิทยาการคอมพิวเตอร์"
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    บทบาทในการใช้งาน (Role) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRequestedRole('user')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        requestedRole === 'user'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      ผู้ใช้งานทั่วไป (User)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestedRole('admin')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        requestedRole === 'admin'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      ผู้ดูแลระบบ (Admin)
                    </button>
                  </div>
                </div>

                {requestedRole === 'admin' && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <label className="block text-xs font-medium text-amber-300 mb-1">
                      รหัสความปลอดภัยผู้ดูแลระบบ (Admin Passcode: ITADMIN2026) *
                    </label>
                    <input
                      type="password"
                      required
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="กรอก ITADMIN2026 เพื่อยืนยันสิทธิ์แอดมิน"
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs font-mono border-amber-500/40"
                    />
                    <span className="text-[10px] text-amber-300/80 mt-1 block">
                      * สำหรับการทดสอบ: กรอก <span className="font-mono font-bold">ITADMIN2026</span> เพื่อสร้างบัญชี Admin ใหม่
                    </span>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">อีเมลสถาบัน / ผู้ใช้งาน *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@it.ac.th"
                  className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">รหัสผ่าน (Password) *</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setForgotStep('request');
                      setForgotEmail(email);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium hover:underline cursor-pointer"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                )}
                {mode === 'register' && <span className="text-[10px] text-slate-400">ขั้นต่ำ 8 ตัวอักษร</span>}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20 border border-cyan-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>กำลังประมวลผล...</span>
                ) : (
                  <span>
                    {mode === 'login' ? 'ดำเนินการต่อ (ไปขั้นตอน OTP)' : 'ยืนยันการสมัครสมาชิก'}
                  </span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Security notice footer */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center text-[10px] text-slate-400">
          <p>
            🔒 ระบบความปลอดภัย 2FA OTP · เข้ารหัส Bcrypt 10 Rounds · บันทึก Security Audit Log ทุกกิจกรรม
          </p>
        </div>
          </motion.div>

          {/* Simulated Mailbox Preview Overlay Modal */}
          {mailboxModalOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMailboxModalOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-slate-100 shadow-2xl z-10 max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">กล่องจดหมายจำลอง (Simulated Mailbox)</h3>
                      <p className="text-[11px] text-slate-400">สำหรับตรวจสอบอีเมลและรหัส OTP ระหว่างที่ยังไม่ได้ต่อ SMTP จริง</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMailboxModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="py-4 overflow-y-auto space-y-4 flex-1">
                  {loadingMailbox ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      กำลังดึงข้อมูลอีเมลล่าสุดจาก Outbox...
                    </div>
                  ) : mailboxEmails.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      ไม่พบอีเมลที่ส่งถึง {forgotEmail} กรุณากดขอรหัส OTP ใหม่อีกครั้ง
                    </div>
                  ) : (
                    mailboxEmails.map((mail, idx) => (
                      <div key={mail.id || idx} className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs pb-2 border-b border-white/5">
                          <div>
                            <span className="text-slate-400">ถึง (To): </span>
                            <span className="text-cyan-300 font-mono font-medium">{forgotEmail}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(mail.sentAt).toLocaleTimeString('th-TH')}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-white">
                          หัวข้อ: {mail.subject}
                        </div>

                        {mail.otpCode && (
                          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                                รหัสยืนยัน OTP 6 หลัก
                              </div>
                              <div className="text-2xl font-black font-mono tracking-widest text-amber-200">
                                {mail.otpCode}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setForgotOtp(mail.otpCode);
                                setCopiedOtp(true);
                                setTimeout(() => setCopiedOtp(false), 2000);
                                setMailboxModalOpen(false);
                              }}
                              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                            >
                              {copiedOtp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedOtp ? 'กรอกเรียบร้อย!' : 'นำรหัสนี้ไปกรอกทันที'}</span>
                            </button>
                          </div>
                        )}

                        <div className="text-xs text-slate-300 whitespace-pre-line bg-slate-900/60 p-3 rounded-lg border border-white/5 font-mono text-[11px] leading-relaxed">
                          {mail.textContent}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    * หากต้องการให้ส่งเข้า Gmail จริง แอดมินสามารถกำหนดค่า SMTP ได้ที่แถบแอดมิน
                  </span>
                  <button
                    type="button"
                    onClick={() => setMailboxModalOpen(false)}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
