import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, CalendarCheck2, ShieldCheck, ArrowRight, Laptop, Cpu, Server, Eye, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

const heroBuildingImg = '/src/assets/images/it_building_hero_1791567692594.jpg';

interface HeroSectionProps {
  onNavigate: (tab: 'rooms' | 'equipment' | 'my-records' | 'feedback' | 'analytics' | 'admin') => void;
  openAuthModal: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate, openAuthModal }) => {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden pt-2 pb-12">
      {/* Ambient background glowing orbs with subtle float */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-glow" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-glow" style={{ animationDelay: '2s' }} />

      {/* Main Hero Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 mb-8 overflow-hidden shadow-2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-xs font-medium shimmer-badge">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>ระบบบริการและบริหารจัดการทรัพยากร อาคารเทคโนโลยีสารสนเทศ (IT Building)</span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight"
            >
              จองห้องปฏิบัติการและขอยืมของส่วนกลาง{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                ตึกไอทีแบบครบวงจร
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl"
            >
              ศูนย์กลางการขอใช้ห้อง Cybersecurity Lab, Network Lab, Studio, ห้องนั่งเล่น 4 ห้อง และยืมอุปกรณ์ IT ส่วนกลาง (Mouse, Keyboard, การ์ดจอ, สายแลน, กล้องและอุปกรณ์เสริม) ปลอดภัยด้วยระบบสิทธิ์ตามบทบาท (RBAC) และ Data Masking
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('rooms')}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CalendarCheck2 className="w-4 h-4" />
                <span>จองห้องปฏิบัติการ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('equipment')}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-cyan-200 glass-card hover:bg-white/10 border border-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Laptop className="w-4 h-4 text-cyan-400" />
                <span>ขอยืมของส่วนกลาง</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('feedback')}
                className="px-4 py-2.5 rounded-xl font-medium text-xs text-amber-200 glass-card hover:bg-amber-500/15 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>ประเมินความพึงพอใจ</span>
              </motion.button>

              {user?.role === 'admin' && (
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('analytics')}
                  className="px-4 py-2.5 rounded-xl font-medium text-xs text-amber-300 glass-card hover:bg-amber-500/15 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>กราฟสถิติ (Admin Data Viz)</span>
                </motion.button>
              )}
            </motion.div>

            {/* User status preview */}
            <motion.div variants={itemVariants} className="pt-2 text-xs text-slate-400 flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2 bg-slate-900/60 py-1.5 px-3 rounded-lg border border-white/5 font-mono text-[11px] shadow-sm">
                  <span className="text-slate-400">เข้าสู่ระบบในชื่อ:</span>
                  <span className="text-cyan-300 font-semibold">{user.name}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-amber-400 uppercase font-bold">สิทธิ์: {user.role}</span>
                </div>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>กรุณาเข้าสู่ระบบเพื่อเริ่มส่งคำขอและจัดการรายการของคุณ</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Image Card with interactive depth and hover motion */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-5 w-full mt-4 lg:mt-0"
          >
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl group w-full bg-slate-900/60"
            >
              <img
                src={heroBuildingImg}
                alt="อาคารคณะเทคโนโลยีสารสนเทศ IT Building"
                className="w-full min-h-[220px] sm:min-h-[280px] h-60 sm:h-72 md:h-80 object-cover object-center transform group-hover:scale-105 transition-transform duration-700 block"
                loading="eager"
                decoding="async"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = '1';
                    target.src = '/src/assets/images/it_building_hero_1791567692594.jpg';
                  } else if (target.dataset.fallback === '1') {
                    target.dataset.fallback = '2';
                    target.src = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80';
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl backdrop-blur-md bg-slate-950/75 border border-white/10 text-xs shadow-lg">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <span>Faculty of Information Technology Building</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  อาคาร 5 ชั้น · Cybersecurity Lab, Network Lab, Digital Studio, ห้องนั่งเล่น 4 โซน และ AI Lab
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Feature & Security Highlights Strip with Staggered Motion */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.div
          whileHover={{ y: -4, borderColor: 'rgba(56, 189, 248, 0.4)' }}
          transition={{ duration: 0.2 }}
          className="glass-card rounded-2xl p-4 border border-white/10 shadow-lg cursor-default"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">ห้องแล็บ & ห้องนั่งเล่น</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cybersecurity Lab, Network Lab, Studio, ห้องนั่งเล่น 4 ห้อง และ AI Innovation Lab
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, borderColor: 'rgba(99, 102, 241, 0.4)' }}
          transition={{ duration: 0.2 }}
          className="glass-card rounded-2xl p-4 border border-white/10 shadow-lg cursor-default"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">อุปกรณ์ไอทีส่วนกลาง</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mouse, Keyboard, การ์ดจอ RTX 4080/4070Ti, สายแลน Cat6/Cat7, กล้อง 4K และอุปกรณ์เสริม
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, borderColor: 'rgba(16, 185, 129, 0.4)' }}
          transition={{ duration: 0.2 }}
          className="glass-card rounded-2xl p-4 border border-white/10 shadow-lg cursor-default"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">RBAC & Ownership CRUD</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            ผู้ใช้ A ไม่สามารถแก้ไขหรือลบข้อมูลผู้ใช้ B (บล็อก IDOR) แยกสิทธิ์ผู้ใช้และ Admin ชัดเจน
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, borderColor: 'rgba(139, 92, 246, 0.4)' }}
          transition={{ duration: 0.2 }}
          className="glass-card rounded-2xl p-4 border border-white/10 shadow-lg cursor-default"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Data Masking (PDPA)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            ปิดบังเลขบัตรประชาชน, เบอร์โทรศัพท์ และรหัสนักศึกษา เมื่อแสดงผลต่อสาธารณะ
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

