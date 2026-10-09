import React, { useState, useEffect } from 'react';
import { OWASPScanReport } from '../types/index.ts';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Clock,
  Sparkles,
  FileCode,
  Lock,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

export const OWASPSecurityCenter: React.FC = () => {
  const [report, setReport] = useState<OWASPScanReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>('owasp-a01');

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/security/owasp-scan', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to run OWASP scan', err);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    runScan();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>ฟีเจอร์ที่ 7 : ศูนย์ตรวจสอบความปลอดภัยตามมาตรฐาน OWASP Top 10</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            OWASP Top 10 Security Audit & Automated Vulnerability Scanner
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ระบบตรวจสอบช่องโหว่ความมั่นคงปลอดภัยแบบอัตโนมัติ ทดสอบการเจาะระบบ (IDOR, SQLi, Hashing, XSS, SSRF) และวิเคราะห์ความสอดคล้องตามมาตรฐานสากล
          </p>
        </div>

        <button
          onClick={runScan}
          disabled={scanning}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/25 border border-emerald-400/40 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          {scanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>กำลังสแกนระบบความปลอดภัย...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>รันการตรวจสอบ OWASP Top 10 สดทันที</span>
            </>
          )}
        </button>
      </div>

      {/* Score Overview Card */}
      {report && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Grade & Score */}
            <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-extrabold text-2xl font-mono shadow-lg shadow-emerald-500/15">
                {report.grade}
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  คะแนนความมั่นคงปลอดภัย
                </span>
                <span className="text-2xl font-bold text-white font-mono tabular-nums">
                  {report.overallScore} / 100
                </span>
              </div>
            </div>

            {/* Total Passed */}
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                การทดสอบที่ผ่านเกณฑ์
              </span>
              <span className="text-xl font-bold text-emerald-300 font-mono tabular-nums">
                {report.passedChecks} จาก {report.totalChecks} หมวดหมู่
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">ครอบคลุม A01 - A10 ครบถ้วน</span>
            </div>

            {/* Execution Duration */}
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                เวลาที่ใช้ในการทดสอบ
              </span>
              <span className="text-xl font-bold text-cyan-300 font-mono tabular-nums">
                {report.executionDurationMs} ms
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Automated Test Suites</span>
            </div>

            {/* Compliance Badge */}
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>OWASP Standard Ready</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                ผ่านเกณฑ์ความปลอดภัยสำหรับแอปพลิเคชันที่มีการจัดเก็บรหัสผ่านและการจองทรัพยากร
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 10 Test Cases Accordion */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">
          รายละเอียดผลการทดสอบแต่ละหมวดหมู่ (OWASP Top 10 Breakdown)
        </h3>

        {report?.results.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-all"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30 font-mono text-xs font-bold">
                    {item.owaspCode.split(':')[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-cyan-400 font-semibold">
                        {item.owaspCode}
                      </span>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {item.testExecuted}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ผ่าน (Score +{item.score})</span>
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-slate-950/40 space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-400 block mb-1">
                      การทดสอบที่ดำเนินการ (Test Executed):
                    </span>
                    <p className="text-slate-200 bg-slate-900/60 p-2.5 rounded-xl border border-white/5 font-mono">
                      {item.testExecuted}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-400 block mb-1">
                      หลักฐานและผลการตรวจสอบ (Audit Evidence):
                    </span>
                    <p className="text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20 leading-relaxed">
                      {item.evidence}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-400 block mb-1">
                      มาตรฐานและการป้องกัน (Standard & Remediation):
                    </span>
                    <p className="text-slate-300 bg-slate-900/40 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                      {item.remediationAndStandard}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
