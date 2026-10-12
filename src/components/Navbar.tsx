import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldAlert,
  LogOut,
  UserCheck,
  KeyRound,
  User,
  Sparkles,
  Menu,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  HeartHandshake,
  Database
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'hero' | 'rooms' | 'equipment' | 'my-records' | 'feedback' | 'analytics' | 'owasp' | 'admin';
  setActiveTab: (tab: 'hero' | 'rooms' | 'equipment' | 'my-records' | 'feedback' | 'analytics' | 'owasp' | 'admin') => void;
  openAuthModal: () => void;
  openSupabaseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openAuthModal, openSupabaseModal }) => {
  const { user, logout, switchDemoAccount, unmaskedPII, toggleUnmaskPII } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/80 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand Wordmark */}
        <button
          onClick={() => setActiveTab('hero')}
          className="text-left group flex items-center gap-2.5 focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 group-hover:text-cyan-300 transition-colors">
            IT Building Portal
          </span>
        </button>

        {/* Zone 2: Animated navigation links */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-300">
          {[
            { id: 'rooms', label: 'จองห้องปฏิบัติการ' },
            { id: 'equipment', label: 'ขอยืมของส่วนกลาง' },
            { id: 'my-records', label: 'รายการของฉัน' },
            { id: 'feedback', label: 'ประเมินความพึงพอใจ' },
            ...(user?.role === 'admin'
              ? [
                  { id: 'analytics', label: 'สถิติ & กราฟ', badge: 'Admin' },
                  { id: 'admin', label: 'แอดมิน (Admin)' },
                ]
              : []),
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`relative px-3.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isActive ? 'text-cyan-300 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-lg bg-cyan-500/20 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)] -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action or user control */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              {/* User profile dropdown trigger */}
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs text-slate-200 transition-colors"
                  title="คลิกเพื่อดูข้อมูลโปรไฟล์ / PII"
                >
                  <div className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                  <span className="font-medium max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                  <span className="text-slate-400 font-mono text-[10px] uppercase">[{user.role}]</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <AnimatePresence>
                  {accountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-72 rounded-xl glass-panel p-4 shadow-2xl border border-white/15 z-50 text-xs"
                    >
                      <div className="pb-3 border-b border-white/10 mb-3">
                        <p className="font-semibold text-white truncate">{user.name}</p>
                        <p className="text-slate-400 truncate">{user.email}</p>
                        <div className="mt-2 text-[11px] text-slate-300 space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-white/5 font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">เลขบัตร ปชช. (PII):</span>
                            <span className="text-cyan-300">
                              {unmaskedPII ? user.citizenId : user.maskedCitizenId}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">เบอร์โทรศัพท์:</span>
                            <span className="text-cyan-300">
                              {unmaskedPII ? user.phone : user.maskedPhone}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">รหัสนักศึกษา/จนท.:</span>
                            <span className="text-cyan-300">
                              {unmaskedPII ? user.studentOrStaffId : user.maskedStudentOrStaffId}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={toggleUnmaskPII}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 transition-colors border border-white/10"
                        >
                          {unmaskedPII ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{unmaskedPII ? 'ซ่อนข้อมูลส่วนบุคคล (Mask PII)' : 'เปิดเผยข้อมูลส่วนบุคคล (Unmask PII)'}</span>
                        </button>
                      </div>

                      <div className="py-2 border-t border-white/10 mb-3 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-[11px] text-slate-400">บทบาทของคุณ:</span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                              user.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้ทั่วไป (User)'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          logout();
                          setAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-medium transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Direct Visible Logout Button */}
              <button
                onClick={logout}
                title="คลิกเพื่อออกจากระบบทันที"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-medium transition-all shadow-sm cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 border border-cyan-400/40 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              เข้าสู่ระบบ / ลงทะเบียน
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown with animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden glass-panel border-t border-white/10 px-4 py-3 space-y-2 overflow-hidden"
          >
            {user && (
              <div className="pb-2 mb-2 border-b border-white/10 flex items-center justify-between text-xs">
                <div className="text-slate-300">
                  <span className="text-white font-medium">{user.name}</span>
                  <span className="ml-2 font-mono text-[10px] text-cyan-300">[{user.role}]</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setActiveTab('rooms');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded hover:bg-white/5 text-sm"
            >
              จองห้องปฏิบัติการ
            </button>
            <button
              onClick={() => {
                setActiveTab('equipment');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded hover:bg-white/5 text-sm"
            >
              ขอยืมของส่วนกลาง
            </button>
            <button
              onClick={() => {
                setActiveTab('my-records');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded hover:bg-white/5 text-sm"
            >
              รายการของฉัน
            </button>
            <button
              onClick={() => {
                setActiveTab('feedback');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded hover:bg-white/5 text-sm text-cyan-300"
            >
              ประเมินความพึงพอใจ
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('analytics');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded hover:bg-white/5 text-sm text-amber-300"
              >
                สถิติ & กราฟ (Data Visualization) - Admin Only
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded hover:bg-white/5 text-sm text-amber-400"
              >
                หน้าผู้ดูแลระบบ (Admin)
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
