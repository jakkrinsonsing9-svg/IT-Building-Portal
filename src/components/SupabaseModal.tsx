import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
  HardDrive,
  KeyRound,
  Globe,
  Trash2,
  X
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Supabase Config State
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [connectedAt, setConnectedAt] = useState<string | undefined>(undefined);
  const [sqlSchema, setSqlSchema] = useState('');

  const [activeSubTab, setActiveSubTab] = useState<'connect' | 'guide' | 'schema' | 'sync'>('connect');
  const [copied, setCopied] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [syncResults, setSyncResults] = useState<any>(null);

  // Fetch Supabase configuration
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/supabase/config');
      if (res.ok) {
        const data = await res.json();
        setUrl(data.url || '');
        setEnabled(data.enabled);
        setHasKey(data.hasKey);
        setConnectedAt(data.connectedAt);
        if (data.sqlSchema) {
          setSqlSchema(data.sqlSchema);
        }
      }
    } catch (err) {
      console.error('Failed to load Supabase config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      setAlert(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle test connection
  const handleTestConnection = async () => {
    if (!url.trim()) {
      setAlert({ type: 'error', message: 'กรุณากรอก Supabase Project URL' });
      return;
    }
    if (!anonKey.trim() && !hasKey) {
      setAlert({ type: 'error', message: 'กรุณากรอก Supabase API Key (Anon Key หรือ Service Role Key)' });
      return;
    }

    setTesting(true);
    setAlert(null);
    try {
      const res = await fetch('/api/supabase/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), key: anonKey.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: data.message });
      } else {
        setAlert({ type: 'error', message: data.message });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: `การทดสอบล้มเหลว: ${err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'}` });
    } finally {
      setTesting(false);
    }
  };

  // Handle Save & Connect
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setAlert({ type: 'error', message: 'กรุณาระบุ Supabase Project URL' });
      return;
    }
    if (!anonKey.trim() && !hasKey) {
      setAlert({ type: 'error', message: 'กรุณาระบุ Supabase Anon Key หรือ Service Role Key' });
      return;
    }

    setLoading(true);
    setAlert(null);
    try {
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: url.trim(),
          anonKey: anonKey.trim() || undefined,
          serviceRoleKey: serviceRoleKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlert({ type: 'success', message: 'เชื่อมต่อฐานข้อมูล Supabase สำเร็จแล้ว!' });
        setEnabled(true);
        setHasKey(true);
        setConnectedAt(new Date().toISOString());
      } else {
        setAlert({ type: 'error', message: data.error || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: `บันทึกล้มเหลว: ${err.message || 'เกิดข้อผิดพลาด'}` });
    } finally {
      setLoading(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (!window.confirm('คุณต้องการยกเลิกการเชื่อมต่อกับ Supabase และกลับไปใช้ Local Database ใช่หรือไม่?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/supabase/disconnect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setEnabled(false);
        setAlert({ type: 'info', message: 'ยกเลิกการเชื่อมต่อ Supabase เรียบร้อยแล้ว ระบบกลับสู่ Local Database' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: `ยกเลิกการเชื่อมต่อไม่สำเร็จ: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Handle Sync data to Supabase
  const handleSyncToSupabase = async () => {
    setSyncing(true);
    setAlert(null);
    setSyncResults(null);
    try {
      const res = await fetch('/api/supabase/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlert({ type: 'success', message: 'ซิงค์ข้อมูลขึ้น Supabase สำเร็จเรียบร้อยแล้ว!' });
        setSyncResults(data.results);
      } else {
        setAlert({ type: 'error', message: data.error || data.message || 'การซิงค์ข้อมูลล้มเหลว' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: `เกิดข้อผิดพลาด: ${err.message}` });
    } finally {
      setSyncing(false);
    }
  };

  const copySchemaToClipboard = () => {
    if (!sqlSchema) return;
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-cyan-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">เชื่อมต่อฐานข้อมูล Supabase (PostgreSQL Cloud)</h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Free Tier 100%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                รองรับการจัดเก็บข้อมูลแบบ Cloud Relational DB ถาวร ไม่หายเมื่อรีสตาร์ท
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">สถานะการเชื่อมต่อ:</span>
            {enabled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Supabase Online (PostgreSQL)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Local Storage Mode (database.json)
              </span>
            )}
          </div>
          {url && (
            <div className="text-slate-400 font-mono truncate max-w-xs">
              Host: <span className="text-slate-300">{url}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-2">
          <button
            onClick={() => setActiveSubTab('connect')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeSubTab === 'connect'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            ตั้งค่าการเชื่อมต่อ (Connect)
          </button>
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeSubTab === 'guide'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            วิธีสร้างโปรเจกต์ฟรีบน Supabase
          </button>
          <button
            onClick={() => setActiveSubTab('schema')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeSubTab === 'schema'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            SQL Schema สำหรับ Supabase
          </button>
          <button
            onClick={() => setActiveSubTab('sync')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeSubTab === 'sync'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            ซิงค์ข้อมูล (Sync Data)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Notifications Alert */}
          {alert && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                alert.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : alert.type === 'error'
                  ? 'bg-red-950/40 border-red-500/30 text-red-300'
                  : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
              }`}
            >
              {alert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : alert.type === 'error' ? (
                <XCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
              )}
              <div className="flex-1">{alert.message}</div>
            </div>
          )}

          {/* TAB 1: Connect Settings Form */}
          {activeSubTab === 'connect' && (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                    <span>Supabase Project URL (URL โปรเจกต์)</span>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      เปิด Supabase Dashboard <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://xyzabcdefg.supabase.co"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    หาได้จากเมนู: <strong>Project Settings → API → Project URL</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                    <span>Supabase API Key (Anon / Public Key หรือ Service Role Key)</span>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      {showKey ? 'ซ่อนรหัส' : 'แสดงรหัส'}
                    </button>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      placeholder={hasKey ? '•••••••••••••••••••• (ตั้งค่าไว้แล้ว)' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    หาได้จากเมนู: <strong>Project Settings → API → Project API Keys (anon public)</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    {testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ (Test)'}
                  </button>

                  {enabled && (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={loading}
                      className="px-3 py-2 bg-red-950/50 hover:bg-red-900 text-red-300 text-xs font-semibold rounded-lg border border-red-800/40 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      ตัดการเชื่อมต่อ
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading ? 'กำลังบันทึก...' : 'บันทึก & เชื่อมต่อ Supabase'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Guide (ขั้นตอนการสมัครและตั้งค่า Supabase) */}
          {activeSubTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">1</span>
                  สมัครสมาชิกฟรีบน Supabase.com
                </h4>
                <p className="text-slate-400 pl-7">
                  ไปที่ <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-semibold">https://supabase.com</a> กดปุ่ม <strong>"Start your project"</strong> หรือ <strong>"Sign in with GitHub"</strong> (ฟรี 100% ไม่ต้องกรอกบัตรเครดิต)
                </p>

                <h4 className="text-sm font-bold text-white flex items-center gap-2 pt-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">2</span>
                  สร้างโปรเจกต์ใหม่ (New Project)
                </h4>
                <p className="text-slate-400 pl-7">
                  กด <strong>"New Project"</strong> ตั้งชื่อโปรเจกต์ (เช่น <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">it-portal-db</code>), ตั้ง Database Password และเลือก Region (เช่น <strong>Singapore [ap-southeast-1]</strong> เพื่อความเร็วสูงสุดในไทย)
                </p>

                <h4 className="text-sm font-bold text-white flex items-center gap-2 pt-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">3</span>
                  คัดลอก Project URL และ API Key
                </h4>
                <p className="text-slate-400 pl-7">
                  ใน Supabase Dashboard ไปที่เมนู <strong>Project Settings → API</strong> แล้วคัดลอก:
                  <br />• <strong>Project URL</strong> (เช่น <code className="text-emerald-300">https://xxxx.supabase.co</code>)
                  <br />• <strong>Project API Keys (anon public)</strong>
                  <br />นำมาวางในหน้าแท็บ <strong>"ตั้งค่าการเชื่อมต่อ"</strong> ของระบบนี้
                </p>

                <h4 className="text-sm font-bold text-white flex items-center gap-2 pt-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">4</span>
                  รัน SQL Schema สร้างตารางใน Supabase
                </h4>
                <p className="text-slate-400 pl-7">
                  ไปที่แท็บ <strong>"SQL Schema สำหรับ Supabase"</strong> ในหน้านี้ กดปุ่มคัดลอก แล้วไปที่เมนู <strong>SQL Editor</strong> ใน Supabase Dashboard วางคำสั่งแล้วกด <strong>RUN</strong> ตารางทั้งหมดจะถูกสร้างขึ้นมาพร้อมใช้งานทันที!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SQL Schema */}
          {activeSubTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">PostgreSQL Schema (DDL) สำหรับ Supabase</h4>
                  <p className="text-[11px] text-slate-400">คัดลอกสคริปต์นี้ไปวางในเมนู SQL Editor บน Supabase Dashboard แล้วกด RUN</p>
                </div>
                <button
                  onClick={copySchemaToClipboard}
                  className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'คัดลอกแล้ว!' : 'คัดลอกคำสั่ง SQL'}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <pre className="p-4 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-72 leading-relaxed">
                  {sqlSchema || '-- กำลังโหลด SQL Schema...'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: Sync Data */}
          {activeSubTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  ซิงค์ข้อมูลปัจจุบันทั้งหมดขึ้น Supabase (Data Migration)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ฟังก์ชันนี้จะอัปโหลดข้อมูลห้องปฏิบัติการ, ครุภัณฑ์ไอที, ผู้ใช้งาน, รายการจองห้อง และคำขอยืมอุปกรณ์จากระบบปัจจุบัน ไปบันทึกลงในตารางบน Supabase Cloud แบบ Upsert อัตโนมัติ
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleSyncToSupabase}
                    disabled={syncing || !enabled}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'กำลังซิงค์ข้อมูลขึ้น Cloud...' : 'เริ่มซิงค์ข้อมูลไปยัง Supabase เดี๋ยวนี้'}
                  </button>

                  {!enabled && (
                    <span className="text-[11px] text-amber-400">
                      * กรุณาเชื่อมต่อ Supabase ในแท็บตั้งค่าก่อนทำการซิงค์
                    </span>
                  )}
                </div>

                {syncResults && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-emerald-400">สรุปผลการซิงค์ข้อมูล:</div>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                      {Object.entries(syncResults).map(([key, val]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {String(val)} รายการ
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>เชื่อมต่อผ่าน REST API & TLS Encryption (OWASP Standards)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-xs font-medium"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
