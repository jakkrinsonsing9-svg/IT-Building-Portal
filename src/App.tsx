import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { RoomBookingSection } from './components/RoomBookingSection.tsx';
import { EquipmentRequestSection } from './components/EquipmentRequestSection.tsx';
import { MyRecordsCRUD } from './components/MyRecordsCRUD.tsx';
import { OWASPSecurityCenter } from './components/OWASPSecurityCenter.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
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
  BarChart3
} from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'hero' | 'rooms' | 'equipment' | 'my-records' | 'analytics' | 'owasp' | 'admin'
  >('hero');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
            <span className="text-slate-200 capitalize">
              {activeTab === 'hero' && 'ภาพรวมอาคารไอที'}
              {activeTab === 'rooms' && 'จองห้องปฏิบัติการ (Form 1)'}
              {activeTab === 'equipment' && 'ขอยืมของส่วนกลาง (Form 2)'}
              {activeTab === 'my-records' && 'รายการของฉัน (CRUD & Data Ownership)'}
              {activeTab === 'analytics' && 'แดชบอร์ดสถิติ & กราฟสรุปผล (Data Visualization)'}
              {activeTab === 'owasp' && 'OWASP Top 10 Security Audit'}
              {activeTab === 'admin' && 'ระบบผู้ดูแลระบบ (Admin)'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">
              <ShieldCheck className="w-3 h-3" />
              <span>OWASP Top 10 Grade A+</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded font-mono">
              <span>Bcrypt Passwords</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded font-mono">
              <span>PDPA PII Masked</span>
            </span>
          </div>
        </div>

        {/* View Routing */}
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
          />
        )}

        {activeTab === 'analytics' && <AnalyticsDashboard />}

        {activeTab === 'owasp' && <OWASPSecurityCenter />}

        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-16 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © 2026 Faculty of Information Technology · ระบบจองห้องและยืมของส่วนกลางตึกไอที
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Bcrypt Hashing</span>
            <span>·</span>
            <span>RBAC Slices</span>
            <span>·</span>
            <span>Resource Ownership Enforcement</span>
            <span>·</span>
            <span>OWASP A01-A10 Compliance</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
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
