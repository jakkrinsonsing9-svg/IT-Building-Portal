import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Mail,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  Server,
  Lock,
  ExternalLink,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface SmtpSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmtpSettingsModal: React.FC<SmtpSettingsModalProps> = ({ isOpen, onClose }) => {
  const { token, user } = useAuth();
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState(587);
  const [secure, setSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('t14583925@gmail.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [fromName, setFromName] = useState('IT Building Portal');
  const [testRecipient, setTestRecipient] = useState('');

  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen || !token) return;
    fetchSmtpConfig();
    if (user?.email) {
      setTestRecipient(user.email);
    }
  }, [isOpen, token]);

  const fetchSmtpConfig = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/smtp', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsConfigured(Boolean(data.isConfigured));
        if (data.config) {
          setHost(data.config.host || 'smtp.gmail.com');
          setPort(data.config.port || 587);
          setSecure(Boolean(data.config.secure));
          setSmtpUser(data.config.user || '');
        }
      }
    } catch (err) {
      console.warn('Failed to fetch SMTP config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host || !smtpUser || !smtpPass) {
      setStatusMessage({ type: 'error', text: 'กรุณากรอก Host, Email ผู้ส่ง และ App Password ให้ครบถ้วน' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          host,
          port,
          secure,
          user: smtpUser,
          pass: smtpPass,
          from: `"${fromName}" <${smtpUser}>`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsConfigured(true);
        setStatusMessage({ type: 'success', text: 'บันทึกการตั้งค่า SMTP สำเร็จเรียบร้อยแล้ว! ระบบพร้อมส่งอีเมลจริง' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'บันทึกไม่สำเร็จ' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: `เกิดข้อผิดพลาด: ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testRecipient.trim()) {
      setStatusMessage({ type: 'error', text: 'กรุณาระบุอีเมลปลายทางสำหรับรับอีเมลทดสอบ' });
      return;
    }

    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient: testRecipient.trim(),
          host,
          port,
          secure,
          user: smtpUser,
          pass: smtpPass,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: `✅ ${data.message} กรุณาเปิดกล่องจดหมาย ${testRecipient} เพื่อตรวจสอบ` });
      } else {
        setStatusMessage({ type: 'error', text: `❌ ${data.error || 'การส่งอีเมลทดสอบล้มเหลว ตรวจสอบรหัสผ่านแอปหรือการตั้งค่า'}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: `เกิดข้อผิดพลาด: ${msg}` });
    } finally {
      setTesting(false);
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
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-slate-100 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ตั้งค่าระบบส่งอีเมลจริง (SMTP Settings)</h3>
                <p className="text-xs text-slate-400">
                  สำหรับส่งรหัสยืนยัน OTP ไปยัง Gmail / อีเมลจริงของผู้ใช้งาน
                </p>
              </div>
            </div>

            {/* Current Status Badge */}
            <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${
              isConfigured
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}>
              {isConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <div className="font-semibold text-sm">
                  สถานะ: {isConfigured ? 'เชื่อมต่อ SMTP สำเร็จแล้ว (พร้อมส่งเมลจริง)' : 'ยังไม่ได้เชื่อมต่อ (กำลังทำงานในโหมดจำลอง Outbox)'}
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {isConfigured
                    ? `เซิร์ฟเวอร์จะส่งอีเมลผ่าน ${host}:${port} ด้วยบัญชี ${smtpUser || ''} โดยตรง`
                    : 'เมื่อผู้ใช้กดลืมรหัสผ่าน รหัส OTP จะถูกส่งเข้ากล่องจดหมายจำลองในหน้าต่าง OTP เพื่อให้ทดสอบได้โดยไม่ต้องเชื่อมต่อจริง หากต้องการให้ส่งเข้า Gmail จริง กรุณากรอก 2 ข้อมูลด้านล่าง'}
                </p>
              </div>
            </div>

            {/* Status Message Alert */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs mb-5 border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            {/* Instructions box for Gmail App Passwords */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 mb-6 text-xs space-y-2 text-slate-300">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>วิธีขอ "รหัสผ่านแอป 16 หลัก" ของ Gmail (ใช้เวลา 1 นาที):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 pl-1 leading-relaxed">
                <li>เปิดบัญชี Google ที่ <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-0.5">myaccount.google.com/apppasswords <ExternalLink className="w-3 h-3" /></a></li>
                <li>เปิดการยืนยันแบบ 2 ขั้นตอน (2-Step Verification) ในบัญชี Google ให้เรียบร้อย</li>
                <li>พิมพ์ชื่อแอปว่า <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono">IT Building Portal</code> แล้วกด <strong>"สร้าง" (Generate)</strong></li>
                <li>คัดลอกรหัสผ่าน 16 หลัก (เช่น <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono">xxxx xxxx xxxx xxxx</code>) มาวางในช่อง <strong>App Password</strong> ด้านล่าง</li>
              </ol>
            </div>

            {/* SMTP Settings Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    SMTP Host *
                  </label>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Port *
                  </label>
                  <input
                    type="number"
                    required
                    value={port}
                    onChange={(e) => setPort(parseInt(e.target.value) || 587)}
                    placeholder="587"
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  1. อีเมลผู้ส่ง (Gmail Address) *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>2. รหัสผ่านแอป 16 หลัก (Gmail App Password) *</span>
                  <span className="text-[10px] text-amber-400 font-medium">ไม่ใช่รหัสผ่าน Gmail ปกติ</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="abcd efgh ijkl mnop"
                    className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ชื่อผู้ส่งที่แสดง (Sender Name)
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="IT Building Portal"
                  className="w-full glass-input px-3.5 py-2 rounded-xl text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 border border-amber-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>บันทึกการตั้งค่า SMTP</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white glass-card hover:bg-white/10 transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </form>

            {/* Test Send Section */}
            <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                <span>ทดสอบส่งอีเมล (Test Email Dispatch)</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                พิมพ์อีเมลที่คุณต้องการรับข้อความทดสอบเพื่อยืนยันว่าการตั้งค่าถูกต้องและอีเมลส่งเข้ากล่องจดหมายจริง
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="ระบุอีเมลปลายทาง เช่น your-name@gmail.com"
                  className="flex-1 glass-input px-3.5 py-2 rounded-xl text-xs"
                />
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTestEmail}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-md shadow-cyan-600/20"
                >
                  {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>ส่งเมลทดสอบ</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
