import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { RoomBookingSection } from './components/RoomBookingSection.tsx';
import { EquipmentRequestSection } from './components/EquipmentRequestSection.tsx';
import { MyRecordsCRUD } from './components/MyRecordsCRUD.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.tsx';
import { SatisfactionSection } from './components/SatisfactionSection.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import {
  ShieldCheck,
  Building2,
  Laptop,
  FileText,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Lock,
  Eye,
  CheckCircle2,
  BarChart3,
  HeartHandshake
} from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'hero' | 'rooms' | 'equipment' | 'my-records' | 'feedback' | 'analytics' | 'owasp' | 'admin'
  >('hero');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [feedbackTarget, setFeedbackTarget] = useState<{
    type: 'room' | 'equipment' | 'overall';
    id?: string;
    name: string;
  } | undefined>(undefined);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Ambient background glows for Glassmorphism depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px]" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
      </div>

      {/* Main Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAuthModal={() => setAuthModalOpen(true)}
        openSupabaseModal={() => setSupabaseModalOpen(true)}
      />

      {/* App Content Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Breadcrumb strip for context */}
        <div className="mb-6 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <span
              onClick={() => setActiveTab('hero')}
              className="hover:text-cyan-400 cursor-pointer transition-colors"
            >
              หน้าแรก
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <AnimatePresence mode="wait">
              <motion.span
                key={activeTab}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.18 }}
                className="text-slate-200 capitalize"
              >
                {activeTab === 'hero' && 'ภาพรวมอาคารไอที'}
                {activeTab === 'rooms' && 'จองห้องปฏิบัติการ'}
                {activeTab === 'equipment' && 'ขอยืมของส่วนกลาง'}
                {activeTab === 'my-records' && 'รายการคำขอของฉัน'}
                {activeTab === 'feedback' && 'ประเมินความพึงพอใจการใช้งาน (CSAT)'}
                {activeTab === 'analytics' && 'แดชบอร์ดสถิติการใช้งาน'}
                {activeTab === 'admin' && 'ระบบผู้ดูแลระบบ (Admin)'}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* View Routing with Smooth Page Transition Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.995 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'hero' && (
              <HeroSection
                onNavigate={(tab) => setActiveTab(tab)}
                openAuthModal={() => setAuthModalOpen(true)}
              />
            )}

            {activeTab === 'rooms' && (
              <RoomBookingSection
                onBookingSuccess={() => {
                  triggerRefresh();
                  setActiveTab('my-records');
                }}
                openAuthModal={() => setAuthModalOpen(true)}
              />
            )}

            {activeTab === 'equipment' && (
              <EquipmentRequestSection
                onRequestSuccess={() => {
                  triggerRefresh();
                  setActiveTab('my-records');
                }}
                openAuthModal={() => setAuthModalOpen(true)}
              />
            )}

            {activeTab === 'my-records' && (
              <MyRecordsCRUD
                openAuthModal={() => setAuthModalOpen(true)}
                refreshTrigger={refreshTrigger}
                onOpenFeedback={(target) => {
                  setFeedbackTarget(target);
                  setActiveTab('feedback');
                }}
              />
            )}

            {activeTab === 'feedback' && (
              <SatisfactionSection
                openAuthModal={() => setAuthModalOpen(true)}
                preselectedTarget={feedbackTarget}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsDashboard />}

            {activeTab === 'admin' && (
              <AdminDashboard onOpenSupabaseModal={() => setSupabaseModalOpen(true)} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-16 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © 2026 Faculty of Information Technology · ระบบจองห้องและยืมของส่วนกลางตึกไอที
          </p>
          <div className="flex items-center gap-3">
            <a
              href="/system_and_pentest_report.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline font-medium transition-colors"
            >
              📥 เปิด/บันทึกรายงาน Pent Test (PDF 6 คะแนน)
            </a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Supabase Database Integration Modal */}
      <SupabaseModal isOpen={supabaseModalOpen} onClose={() => setSupabaseModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
