import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Lock, Mail, User, Phone, CreditCard, School, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, switchDemoAccount } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          setSuccessMsg('เข้าสู่ระบบสำเร็จ');
          setTimeout(() => {
            onClose();
          }, 600);
        } else {
          setError(res.error || 'เข้าสู่ระบบไม่สำเร็จ');
        }
      } else {
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
            onClose();
          }, 800);
        } else {
          setError(res.error || 'ลงทะเบียนไม่สำเร็จ');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (account: 'admin' | 'userA' | 'userB') => {
    setLoading(true);
    setError(null);
    try {
      await switchDemoAccount(account);
      setSuccessMsg('เข้าสู่ระบบบัญชีตัวอย่างสำเร็จ');
      setTimeout(() => {
        onClose();
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 sm:p-8 border border-white/15 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'เข้าสู่ระบบ IT Building Portal' : 'สมัครสมาชิกผู้ใช้งานใหม่'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ระบบยืนยันตัวตนพร้อม Password Hashing (Bcrypt) และ Data Masking ตามข้อกำหนด OWASP
          </p>
        </div>

        {/* Quick Demo Switcher Strip */}
        <div className="mb-6 p-3 rounded-xl bg-slate-900/80 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>เข้าสู่ระบบด่วนสำหรับทดสอบสิทธิ์</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleDemoSelect('admin')}
            className="w-full py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs text-amber-200 text-center font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>เข้าสู่ระบบด้วยบัญชีแอดมิน (admin@it.ac.th)</span>
            <span className="text-[10px] font-mono bg-amber-500/30 px-1.5 py-0.5 rounded text-amber-300">Default Admin</span>
          </button>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            ล้างข้อมูลตัวอย่างทั้งหมดแล้ว พร้อมให้คุณลงทะเบียนบัญชีใหม่เพื่อทดสอบด้วยตนเอง
          </p>
        </div>

        {/* Mode Tabs */}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
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
                      placeholder="เช่น 66070199"
                      className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    เบอร์โทรศัพท์มือถือ *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08X-XXX-XXXX"
                      className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>เลขประจำตัวประชาชน (13 หลัก) *</span>
                  <span className="text-[10px] text-cyan-400">ระบบจะ Masking ปิดบังข้อมูล</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={13}
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    placeholder="11002XXXXXXXX"
                    className="w-full glass-input pl-9 pr-3 py-2 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">สาขาวิชา / ภาควิชา</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-lg text-xs"
                >
                  <option value="สาขาวิทยาการคอมพิวเตอร์และปัญญาประดิษฐ์" className="bg-slate-900">
                    วิทยาการคอมพิวเตอร์และปัญญาประดิษฐ์
                  </option>
                  <option value="สาขาความมั่นคงไซเบอร์และเครือข่าย" className="bg-slate-900">
                    ความมั่นคงไซเบอร์และเครือข่าย (Cyber Security)
                  </option>
                  <option value="สาขาวิศวกรรมซอฟต์แวร์" className="bg-slate-900">
                    วิศวกรรมซอฟต์แวร์ (Software Engineering)
                  </option>
                  <option value="สาขาเทคโนโลยีสารสนเทศเพื่อธุรกิจ" className="bg-slate-900">
                    เทคโนโลยีสารสนเทศเพื่อธุรกิจ
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  บทบาทที่ต้องการสมัคร (Account Role) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestedRole('user')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      requestedRole === 'user'
                        ? 'bg-cyan-500/25 border-cyan-400 text-white font-bold shadow-sm'
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    1. ผู้ใช้ทั่วไป (User)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestedRole('admin')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      requestedRole === 'admin'
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold shadow-sm'
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    2. ผู้ดูแลระบบ (Admin)
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
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20 border border-cyan-400/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>กำลังประมวลผล...</span>
              ) : (
                <span>{mode === 'login' ? 'เข้าสู่ระบบ (Sign In)' : 'ยืนยันการสมัครสมาชิก'}</span>
              )}
            </button>
          </div>
        </form>

        {/* Security notice footer */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center text-[10px] text-slate-400">
          <p>
            🔒 เข้ารหัสรหัสผ่านด้วย Bcrypt 10 Rounds Salted Hash · ข้อมูลส่วนบุคคลได้รับการคุ้มครองด้วย PDPA Masking
          </p>
        </div>
      </div>
    </div>
  );
};
