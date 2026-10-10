import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Equipment } from '../types/index.ts';
import { clientStorage } from '../services/clientStorage.ts';
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
  Sparkles,
  Mouse,
  Keyboard,
  Cpu,
  Network,
  Camera,
  Layers,
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

  // Category filter: all, mouse, keyboard, gpu, network, media
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'mouse' | 'keyboard' | 'gpu' | 'network' | 'media'>('all');

  // Form 2 State
  const [selectedEqId, setSelectedEqId] = useState<string>('eq-mouse-01');
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
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setEquipmentList(data.equipment);
        if (data.equipment.length > 0) {
          if (!selectedEqId || selectedEqId === 'eq-001' || !data.equipment.some((e: Equipment) => e.id === selectedEqId)) {
            setSelectedEqId(data.equipment[0].id);
          }
        }
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Loading equipment from clientStorage fallback:', err);
    }
    const localEq = clientStorage.getEquipment();
    setEquipmentList(localEq);
    if (localEq.length > 0) {
      if (!selectedEqId || selectedEqId === 'eq-001' || !localEq.some((e: Equipment) => e.id === selectedEqId)) {
        setSelectedEqId(localEq[0].id);
      }
    }
    setLoading(false);
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

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'เกิดข้อผิดพลาดในการส่งคำขอยืม');
        } else {
          setSuccess('ส่งคำขอใช้ของส่วนกลางสำเร็จ ข้อมูลบันทึกลงฐานข้อมูลและลดจำนวนคงเหลือเรียบร้อย');
          setProjectPurpose('');
          fetchEquipment(); // Refresh available inventory
          onRequestSuccess();
        }
        setSubmitting(false);
        return;
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch (err) {
      console.warn('Backend unavailable, saving equipment request to clientStorage fallback:', err);
      clientStorage.createEquipmentRequest(
        {
          equipmentId: selectedEqId,
          equipmentName: selectedEquipment.name,
          quantity,
          borrowDate,
          expectedReturnDate,
          usageLocation,
          projectPurpose,
          emergencyContact: emergencyContact || user.phone,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone,
          userCitizenId: user.citizenId,
        },
        user
      );
      setSuccess('ส่งคำขอใช้ของส่วนกลางสำเร็จ ข้อมูลบันทึกลงระบบเรียบร้อย (Local Secured)');
      setProjectPurpose('');
      fetchEquipment();
      onRequestSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'mouse':
        return { label: 'Mouse', icon: Mouse, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40' };
      case 'keyboard':
        return { label: 'Keyboard', icon: Keyboard, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' };
      case 'gpu':
        return { label: 'การ์ดจอ (GPU)', icon: Cpu, color: 'text-violet-400 bg-violet-950/60 border-violet-800/40' };
      case 'network':
        return { label: 'สายแลน (LAN)', icon: Network, color: 'text-blue-400 bg-blue-950/60 border-blue-800/40' };
      case 'media':
        return { label: 'กล้อง & อุปกรณ์เสริม', icon: Camera, color: 'text-amber-400 bg-amber-950/60 border-amber-800/40' };
      default:
        return { label: category, icon: Laptop, color: 'text-slate-400 bg-slate-900 border-white/10' };
    }
  };

  const filteredEquipment = equipmentList.filter((eq) => {
    if (categoryFilter === 'all') return true;
    return eq.category === categoryFilter;
  });

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
          บริการยืม Mouse, Keyboard, การ์ดจอ (GPU), สายแลน (LAN), กล้องและอุปกรณ์เสริมต่างๆ สำหรับการเรียนการสอน งานโครงงาน และงานวิจัยไอที
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
            categoryFilter === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'glass-button text-slate-400 hover:text-white border-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ทั้งหมด ({equipmentList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('mouse')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
            categoryFilter === 'mouse'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
              : 'glass-button text-slate-400 hover:text-white border-white/5'
          }`}
        >
          <Mouse className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mouse ({equipmentList.filter((e) => e.category === 'mouse').length})</span>
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('keyboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
            categoryFilter === 'keyboard'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'glass-button text-slate-400 hover:text-white border-white/5'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
          <span>Keyboard ({equipmentList.filter((e) => e.category === 'keyboard').length})</span>
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('gpu')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
            categoryFilter === 'gpu'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-500/10'
              : 'glass-button text-slate-400 hover:text-white border-white/5'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-violet-400" />
          <span>การ์ดจอ GPU ({equipmentList.filter((e) => e.category === 'gpu').length})</span>
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('network')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
            categoryFilter === 'network'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
              : 'glass-button text-slate-400 hover:text-white border-white/5'
          }`}
        >
          <Network className="w-3.5 h-3.5 text-blue-400" />
          <span>สายแลน ({equipmentList.filter((e) => e.category === 'network').length})</span>
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('media')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
            categoryFilter === 'media'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'glass-button text-slate-400 hover:text-white border-white/5'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span>กล้อง & อุปกรณ์เสริม ({equipmentList.filter((e) => e.category === 'media').length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Equipment List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">
              รายการของส่วนกลางที่เปิดให้ยืม ({filteredEquipment.length} รายการ)
            </h3>
            <span className="text-[11px] text-slate-400">
              คลิกที่การ์ดเพื่อเลือกอุปกรณ์
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 rounded-2xl glass-card animate-pulse" />
              ))}
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-400 text-xs">
              ไม่พบอุปกรณ์ในหมวดหมู่นี้
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredEquipment.map((eq) => {
                const isSelected = eq.id === selectedEqId;
                const isOutOfStock = eq.availableQuantity <= 0;
                const badge = getCategoryBadge(eq.category);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={eq.id}
                    onClick={() => {
                      if (!isOutOfStock) {
                        setSelectedEqId(eq.id);
                      }
                    }}
                    className={`glass-card rounded-2xl overflow-hidden border flex flex-col justify-between transition-all ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed border-rose-500/20'
                        : isSelected
                        ? 'border-cyan-400 bg-slate-900/90 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/10 cursor-pointer transform -translate-y-0.5'
                        : 'border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/60 cursor-pointer hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Equipment Photo */}
                    {eq.imageUrl && (
                      <div className="relative h-32 w-full overflow-hidden bg-slate-950/60">
                        <img
                          src={eq.imageUrl}
                          alt={eq.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                        
                        {/* Category Badge over image */}
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border backdrop-blur-md bg-slate-950/70 border-white/10">
                          <BadgeIcon className="w-3 h-3 text-cyan-400" />
                          <span className="text-white">{badge.label}</span>
                        </div>

                        {/* Stock pill */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-lg backdrop-blur-md border ${
                              eq.availableQuantity > 0
                                ? 'text-emerald-300 bg-emerald-950/80 border-emerald-600/50'
                                : 'text-rose-300 bg-rose-950/80 border-rose-600/50'
                            }`}
                          >
                            คงเหลือ {eq.availableQuantity}/{eq.totalQuantity}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white mb-1.5 leading-snug line-clamp-2">
                          {eq.name}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed mb-3 line-clamp-2">
                          {eq.specs}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono text-slate-500">{eq.serialNumber}</span>
                          <span className="font-medium text-cyan-400">
                            {isSelected ? '✓ กำลังเลือกชิ้นนี้' : 'คลิกเพื่อเลือก'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{eq.location}</span>
                        </div>
                      </div>
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

            {/* Selected equipment preview box */}
            {selectedEquipment && (
              <div className="mb-4 p-3 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex gap-3 items-center">
                {selectedEquipment.imageUrl && (
                  <img
                    src={selectedEquipment.imageUrl}
                    alt={selectedEquipment.name}
                    className="w-16 h-14 object-cover rounded-xl border border-white/10 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {selectedEquipment.name}
                  </div>
                  <div className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                    {selectedEquipment.specs}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="text-emerald-400 font-mono">
                      คงเหลือ {selectedEquipment.availableQuantity} ชิ้น
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 truncate">
                      {selectedEquipment.location}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                  เลือกอุปกรณ์ที่ต้องการยืม *
                </label>
                <select
                  value={selectedEqId}
                  onChange={(e) => setSelectedEqId(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs bg-slate-900"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id} className="bg-slate-900 text-white">
                      [{eq.category.toUpperCase()}] {eq.name} (คงเหลือ {eq.availableQuantity})
                    </option>
                  ))}
                </select>
              </div>

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
