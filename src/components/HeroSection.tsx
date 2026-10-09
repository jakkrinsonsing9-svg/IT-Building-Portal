import React from 'react';
import { Sparkles, CalendarCheck2, ShieldCheck, ArrowRight, Laptop, Cpu, Server, Eye, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface HeroSectionProps {
  onNavigate: (tab: 'rooms' | 'equipment' | 'my-records' | 'analytics' | 'owasp' | 'admin') => void;
  openAuthModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate, openAuthModal }) => {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden pt-4 pb-12">
      {/* Ambient background glowing orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Hero Container */}
      <div className="relative glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 mb-8 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ระบบบริการและบริหารจัดการทรัพยากร อาคารเทคโนโลยีสารสนเทศ (IT Building)</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              จองห้องปฏิบัติการและขอยืมของส่วนกลาง <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">ตึกไอทีแบบครบวงจร</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              ศูนย์กลางการขอใช้ห้อง AI Lab, Cyber Security Lab, VR Studio และยืมอุปกรณ์ IT สมรรถนะสูง ปลอดภัยด้วยระบบสิทธิ์ตามบทบาท (RBAC), Data Masking และผ่านการทดสอบ OWASP Top 10
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('rooms')}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CalendarCheck2 className="w-4 h-4" />
                <span>จองห้องปฏิบัติการ (Form 1)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate('equipment')}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-cyan-200 glass-card hover:bg-white/10 border border-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Laptop className="w-4 h-4 text-cyan-400" />
                <span>ขอยืมของส่วนกลาง (Form 2)</span>
              </button>

              {user?.role === 'admin' && (
                <button
                  onClick={() => onNavigate('analytics')}
                  className="px-4 py-2.5 rounded-xl font-medium text-xs text-amber-300 glass-card hover:bg-amber-500/15 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>กราฟสถิติ (Admin Data Viz)</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('owasp')}
                className="px-4 py-2.5 rounded-xl font-medium text-xs text-emerald-300 glass-card hover:bg-emerald-500/15 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ตรวจสอบ OWASP</span>
              </button>
            </div>

            {/* User status preview */}
            <div className="pt-2 text-xs text-slate-400 flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2 bg-slate-900/60 py-1 px-3 rounded-lg border border-white/5 font-mono text-[11px]">
                  <span className="text-slate-400">เข้าสู่ระบบในชื่อ:</span>
                  <span className="text-cyan-300 font-semibold">{user.name}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-amber-400 uppercase">สิทธิ์: {user.role}</span>
                </div>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>กรุณาเข้าสู่ระบบเพื่อเริ่มส่งคำขอและจัดการรายการของคุณ</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right Image Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl group">
              <img
                src="/src/assets/images/it_building_hero_1791567692594.jpg"
                alt="อาคารคณะเทคโนโลยีสารสนเทศ IT Building"
                className="w-full h-72 sm:h-80 object-cover transform group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl backdrop-blur-md bg-slate-950/70 border border-white/10 text-xs">
                <p className="font-semibold text-white">Faculty of Information Technology Building</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  อาคาร 5 ชั้น · รองรับงานวิจัย AI, Cyber Security, Cloud Infrastructure และ VR Production
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature & Security Highlights Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">5 ห้องปฏิบัติการ</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            AI Lab, Cyber CTF Lab, Studio 202, Innovation Suite, Maker Space พร้อมเครื่องมือทันสมัย
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">อุปกรณ์ไอทีส่วนกลาง</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Meta Quest 3 VR, MacBook M3 Max, RTX 4090 eGPU, Cisco Enterprise Switch และชุด Cinema FX3
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">RBAC & Ownership CRUD</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            ผู้ใช้ A ไม่สามารถแก้ไขหรือลบข้อมูลผู้ใช้ B (บล็อก IDOR) แยกสิทธิ์ผู้ใช้และ Admin ชัดเจน
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Data Masking (PDPA)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            ปิดบังเลขบัตรประชาชน, เบอร์โทรศัพท์ และรหัสนักศึกษา เมื่อแสดงผลต่อสาธารณะ
          </p>
        </div>
      </div>
    </div>
  );
};
