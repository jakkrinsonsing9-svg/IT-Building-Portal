import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Equipment } from '../types/index.ts';
import {
  Laptop,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  FileText,
  Phone,
  ShieldCheck,
  PackageCheck,
  Sparkles
} from 'lucide-react';

interface EquipmentRequestSectionProps {
  onRequestSuccess: () => void;
  openAuthModal: () => void;
}

export const EquipmentRequestSection: React.FC<EquipmentRequestSectionProps> = ({
  onRequestSuccess,
  openAuthModal,
}) => {
  const { user, token } = useAuth();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form 2 State
  const [selectedEqId, setSelectedEqId] = useState<string>('eq-001');
  const [quantity, setQuantity] = useState<number>(1);
  const [borrowDate, setBorrowDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [usageLocation, setUsageLocation] = useState<string>('อาคารไอที ชั้น 4 ห้องแล็บคอมพิวเตอร์');
  const [projectPurpose, setProjectPurpose] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchEquipment = async () => {
    try {
      const res = await fetch('/api/catalog/equipment');
      if (res.ok) {
        const data = await res.json();
        setEquipmentList(data.equipment);
        if (data.equipment.length > 0 && !selectedEqId) {
          setSelectedEqId(data.equipment[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load equipment catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const selectedEquipment = equipmentList.find((e) => e.id === selectedEqId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user || !token) {
      openAuthModal();
      return;
    }

    if (!selectedEquipment) {
      setError('กรุณาเลือกอุปกรณ์');
      return;
    }

    if (quantity > selectedEquipment.availableQuantity) {
      setError(`อุปกรณ์คงเหลือให้ยืมเพียง ${selectedEquipment.availableQuantity} ชิ้น`);
      return;
    }

    if (!projectPurpose.trim()) {
      setError('กรุณาระบุวัตถุประสงค์และเหตุผลความจำเป็นในการยืม');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/equipment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          equipmentId: selectedEqId,
          quantity,
          borrowDate,
          expectedReturnDate,
          usageLocation,
          projectPurpose,
          emergencyContact: emergencyContact || user.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการส่งคำขอยืม');
      } else {
        setSuccess('ส่งคำขอใช้ของส่วนกลางสำเร็จ ข้อมูลบันทึกลงฐานข้อมูลและลดจำนวนคงเหลือเรียบร้อย');
        setProjectPurpose('');
        fetchEquipment(); // Refresh available inventory
        onRequestSuccess();
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Laptop className="w-4 h-4" />
          <span>ฟอร์มที่ 2 : แบบฟอร์มขอใช้และยืมของส่วนกลางตึกไอที (IT Equipment & Resources)</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          ยืมอุปกรณ์และครุภัณฑ์คอมพิวเตอร์ส่วนกลาง
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          บริการยืมอุปกรณ์ฮาร์ดแวร์, แว่น VR, ชุดสวิตช์เครือข่าย, eGPU และอุปกรณ์บันทึกภาพสำหรับงานวิจัยและโครงงาน
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Equipment List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">รายการของส่วนกลางที่เปิดให้ยืม</h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl glass-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {equipmentList.map((eq) => {
                const isSelected = eq.id === selectedEqId;
                const isOutOfStock = eq.availableQuantity <= 0;

                return (
                  <div
                    key={eq.id}
                    onClick={() => !isOutOfStock && setSelectedEqId(eq.id)}
                    className={`glass-card rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed border-rose-500/20'
                        : isSelected
                        ? 'border-cyan-400 bg-slate-900/80 ring-2 ring-cyan-500/30 cursor-pointer'
                        : 'border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/60 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950/80 text-cyan-300 border border-white/5">
                          {eq.category.replace('_', '/')}
                        </span>
                        <span
                          className={`text-xs font-mono tabular-nums px-2 py-0.5 rounded ${
                            eq.availableQuantity > 0
                              ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800/40'
                              : 'text-rose-300 bg-rose-950/60 border border-rose-800/40'
                          }`}
                        >
                          คงเหลือ {eq.availableQuantity}/{eq.totalQuantity}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">{eq.name}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed mb-2 line-clamp-2">
                        {eq.specs}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono">{eq.serialNumber}</span>
                      <span className="text-cyan-400 text-xs font-medium">
                        {isSelected ? '✓ เลือกแล้ว' : 'คลิกเพื่อเลือก'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Request Form (Form 2) (5 cols) */}
        <div className="lg:col-span-5">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/15 sticky top-24 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>แบบฟอร์มขอยืมอุปกรณ์</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  อุปกรณ์:{' '}
                  <span className="text-cyan-300 font-bold">
                    {selectedEquipment ? selectedEquipment.name : '-'}
                  </span>
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  จำนวนที่ต้องการยืม (ชิ้น) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedEquipment?.availableQuantity || 1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  คงเหลือพร้อมยืม:{' '}
                  <span className="text-emerald-400 font-mono">
                    {selectedEquipment?.availableQuantity || 0}
                  </span>{' '}
                  ชิ้น
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    วันที่เริ่มยืม *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="date"
                      required
                      value={borrowDate}
                      onChange={(e) => setBorrowDate(e.target.value)}
                      className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    กำหนดส่งคืน *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="date"
                      required
                      value={expectedReturnDate}
                      onChange={(e) => setExpectedReturnDate(e.target.value)}
                      className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  สถานที่นำไปใช้งาน *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={usageLocation}
                    onChange={(e) => setUsageLocation(e.target.value)}
                    placeholder="เช่น อาคารไอที ชั้น 4 ห้องแล็บคอมพิวเตอร์ LAB-401"
                    className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  เบอร์ติดต่อฉุกเฉินผู้รับผิดชอบ
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder={user?.phone || '08X-XXX-XXXX'}
                    className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  วัตถุประสงค์และเหตุผลความจำเป็น *
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    required
                    value={projectPurpose}
                    onChange={(e) => setProjectPurpose(e.target.value)}
                    placeholder="เช่น เพื่อใช้ทดสอบการรับส่งข้อมูลโปรเจกต์ IoT หรือวิจัยเครือข่ายความปลอดภัย"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs resize-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>บันทึกลงฐานข้อมูลและผูกสิทธิ์เจ้าของ</span>
                </div>
                <p>
                  ผู้ใช้ A แก้ไขหรือยกเลิกรายการของตนเองได้เท่านั้น เจ้าหน้าที่ Admin สามารถตรวจสอบและเปลี่ยนสถานะการส่งมอบได้
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>กำลังบันทึกคำขอ...</span>
                ) : user ? (
                  <span>ยืนยันการขอยืมอุปกรณ์ (Form 2)</span>
                ) : (
                  <span>เข้าสู่ระบบก่อนทำการขอยืมอุปกรณ์</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
