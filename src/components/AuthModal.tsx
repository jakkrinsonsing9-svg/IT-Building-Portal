import React, { useState, useEffect } from 'react';
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
  RotateCw,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, verifyOtp, resendOtp, switchDemoAccount } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 2FA OTP state
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otpCode, setOtpCode] = useState('');
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [otpMaskedEmail, setOtpMaskedEmail] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

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

  if (!isOpen) return null;

  const resetOtpFlow = () => {
    setStep('credentials');
    setOtpCode('');
    setOtpTargetEmail('');
    setDevOtpHint(null);
    setError(null);
  };

  const handleClose = () => {
    resetOtpFlow();
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await login(email, password, true);
      if (res.success) {
        if (res.requireOtp) {
          // Switch to OTP step
          setStep('otp');
          setOtpTargetEmail(res.email || email);
          setOtpMaskedEmail(res.maskedEmail || email);
          setDevOtpHint(res.devOtpCode || null);
          setResendCooldown(60);
          setSuccessMsg(`ระบบส่งรหัสยืนยัน OTP ไปที่ ${res.maskedEmail || email} แล้ว`);
        } else {
          setSuccessMsg('เข้าสู่ระบบสำเร็จ');
          setTimeout(() => {
            handleClose();
          }, 600);
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
        setDevOtpHint(res.devOtpCode || null);
        setSuccessMsg(res.message || 'ส่งรหัส OTP ใหม่อีกครั้งเรียบร้อย');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 sm:p-8 border border-white/15 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 mb-3 shadow-lg shadow-cyan-500/10">
            {step === 'otp' ? <KeyRound className="w-6 h-6 text-amber-400" /> : <Lock className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {step === 'otp'
              ? 'พิสูจน์ตัวตน 2 ขั้นตอน (2FA OTP)'
              : mode === 'login'
              ? 'เข้าสู่ระบบ IT Building Portal'
              : 'สมัครสมาชิกผู้ใช้งานใหม่'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'otp'
              ? 'กรุณากรอกรหัส OTP 6 หลักที่ระบบส่งไปยังอีเมลของคุณเพื่อยืนยันตัวตน'
              : 'ระบบยืนยันตัวตนพร้อมรหัส OTP 2FA, Password Hashing (Bcrypt) และ Data Masking'}
          </p>
        </div>

        {/* Quick Demo Switcher Strip - only show on credentials step */}
        {step === 'credentials' && (
          <div className="mb-6 p-3 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>เข้าสู่ระบบด่วนสำหรับทดสอบ</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDemoSelect('admin')}
              className="w-full py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs text-amber-200 text-center font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>เข้าสู่ระบบด้วยบัญชีแอดมิน (admin@it.ac.th)</span>
              <span className="text-[10px] font-mono bg-amber-500/30 px-1.5 py-0.5 rounded text-amber-300">Default Admin</span>
            </button>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              * ข้อมูลผู้ใช้ใหม่ที่คุณสร้าง จะต้องผ่านระบบยืนยันรหัส OTP 2FA ทุกครั้ง
            </p>
          </div>
        )}

        {/* Mode Tabs - only show on credentials step */}
        {step === 'credentials' && (
          <div className="flex rounded-lg bg-slate-950/60 p-1 mb-5 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
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
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-cyan-500/30 text-white border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ลงทะเบียนใหม่ (Register)
            </button>
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

        {/* STEP 2: 2FA OTP VERIFICATION VIEW */}
        {step === 'otp' ? (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30 text-center">
              <div className="text-xs text-slate-400 mb-1">รหัสยืนยันตัวตนถูกส่งไปยัง</div>
              <div className="text-sm font-semibold text-cyan-300 font-mono">{otpMaskedEmail}</div>

              {/* Development Convenience Banner */}
              {devOtpHint && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>รหัส OTP สำหรับทดสอบในระบบ (Dev Mode):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(devOtpHint)}
                      className="text-[10px] font-bold text-amber-200 bg-amber-500/30 hover:bg-amber-500/50 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      คลิกเพื่อกรอกอัตโนมัติ
                    </button>
                  </div>
                  <div className="text-center mt-1.5">
                    <span className="font-mono text-xl tracking-[0.3em] font-black text-amber-300 bg-black/40 px-3 py-1 rounded border border-amber-400/30">
                      {devOtpHint}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-400/80 mt-1.5 text-center">
                    (รหัสมีอายุ 5 นาที และสามารถกดขอรหัสใหม่ได้)
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                กรอกรหัส OTP 6 หลัก (One-Time Password)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-[0.4em] font-mono text-2xl font-bold py-3 px-4 rounded-xl glass-input border-cyan-500/40 text-cyan-200 focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>ไม่ได้รับรหัส OTP?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResendOtp}
                className={`flex items-center gap-1 font-medium transition-colors ${
                  resendCooldown > 0
                    ? 'text-slate-500 cursor-not-allowed'
                    : 'text-cyan-400 hover:text-cyan-300 cursor-pointer'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0 ? `ขอรหัสใหม่ได้ใน (${resendCooldown}s)` : 'กดส่งรหัสใหม่อีกครั้ง'}
                </span>
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20 border border-cyan-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>กำลังตรวจสอบ OTP...</span>
                ) : (
                  <>
                    <span>ยืนยันรหัส OTP และเข้าสู่ระบบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetOtpFlow}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← ย้อนกลับไปหน้ากรอกอีเมลและรหัสผ่าน
              </button>
            </div>
          </form>
        ) : (
          /* STEP 1: CREDENTIALS FORM (LOGIN / REGISTER) */
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">เบอร์โทรศัพท์ติดต่อ *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="081-234-5678"
                        className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">หน่วยงาน / สาขาวิชา</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="สาขาวิทยาการคอมพิวเตอร์"
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">เลือกประเภทบัญชี *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRequestedRole('user')}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        requestedRole === 'user'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      นักศึกษา / บุคลากร (User)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestedRole('admin')}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
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
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>รหัสผ่าน (Password) *</span>
                {mode === 'register' && <span className="text-[10px] text-slate-400">ขั้นต่ำ 8 ตัวอักษร</span>}
              </label>
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
      </div>
    </div>
  );
};
