import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Room } from '../types/index.ts';
import { clientStorage } from '../services/clientStorage.ts';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  ShieldAlert,
  Shield,
  Network,
  Video,
  Coffee,
} from 'lucide-react';

interface RoomBookingSectionProps {
  onBookingSuccess: () => void;
  openAuthModal: () => void;
}

export const RoomBookingSection: React.FC<RoomBookingSectionProps> = ({
  onBookingSuccess,
  openAuthModal,
}) => {
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Form 1 State
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-401');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [purpose, setPurpose] = useState<string>('');
  const [attendeesCount, setAttendeesCount] = useState<number>(15);
  const [advisorName, setAdvisorName] = useState<string>('');
  const [facilities, setFacilities] = useState<string[]>([
    'จอสัมผัส Smartboard 86"',
    'Gigabit Ethernet Drop',
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/catalog/rooms');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data.rooms) && data.rooms.length > 0) {
            setRooms(data.rooms);
            setSelectedRoomId(data.rooms[0].id);
            setLoadingRooms(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Loading rooms from clientStorage fallback:', err);
      }
      const localRooms = clientStorage.getRooms();
      setRooms(localRooms);
      if (localRooms.length > 0) {
        setSelectedRoomId(localRooms[0].id);
      }
      setLoadingRooms(false);
    };
    fetchRooms();
  }, []);

  const handleFacilityToggle = (item: string) => {
    if (facilities.includes(item)) {
      setFacilities(facilities.filter((f) => f !== item));
    } else {
      setFacilities([...facilities, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user || !token) {
      openAuthModal();
      return;
    }

    if (!purpose.trim()) {
      setError('กรุณาระบุวัตถุประสงค์การใช้งานห้อง');
      return;
    }

    setSubmitting(true);
    const roomObj = rooms.find((r) => r.id === selectedRoomId);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: selectedRoomId,
          date,
          startTime,
          endTime,
          purpose,
          attendeesCount,
          requestedFacilities: facilities,
          advisorName,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกการจอง');
        } else {
          setSuccess('ส่งคำขอจองห้องสำเร็จ ข้อมูลถูกบันทึกลงระบบเรียบร้อยแล้ว');
          setPurpose('');
          onBookingSuccess();
        }
        setSubmitting(false);
        return;
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch (err) {
      console.warn('Backend unavailable, saving booking to clientStorage fallback:', err);
      clientStorage.createBooking(
        {
          roomId: selectedRoomId,
          roomCode: roomObj?.code || 'LAB-401',
          roomName: roomObj?.name || 'ห้องปฏิบัติการ',
          date,
          startTime,
          endTime,
          purpose,
          attendeesCount,
          requestedFacilities: facilities,
          advisorName,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone,
          userStudentId: user.studentOrStaffId,
        },
        user
      );
      setSuccess('ส่งคำขอจองห้องสำเร็จ ข้อมูลถูกบันทึกลงระบบเรียบร้อยแล้ว (Local Secured)');
      setPurpose('');
      onBookingSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  // Room Category Filter
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'cybersec' | 'network' | 'studio' | 'lounge'>('all');

  const getRoomBadge = (room: Room) => {
    if (room.id === 'room-cybersec' || room.code === 'LAB-CYBER') {
      return {
        label: 'Cybersecurity Lab',
        badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
        icon: <Shield className="w-3 h-3 text-cyan-400" />,
      };
    }
    if (room.id === 'room-network' || room.code === 'LAB-NET') {
      return {
        label: 'Network Lab',
        badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
        icon: <Network className="w-3 h-3 text-blue-400" />,
      };
    }
    if (room.id === 'room-studio' || room.type === 'studio') {
      return {
        label: 'Multimedia Studio',
        badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
        icon: <Video className="w-3 h-3 text-purple-400" />,
      };
    }
    if (room.id.startsWith('room-lounge') || room.type === 'lounge') {
      return {
        label: 'ห้องนั่งเล่น / Lounge',
        badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
        icon: <Coffee className="w-3 h-3 text-emerald-400" />,
      };
    }
    return {
      label: room.code,
      badgeClass: 'bg-slate-900 text-slate-300 border-white/10',
      icon: <Building2 className="w-3 h-3 text-slate-400" />,
    };
  };

  const filteredRooms = rooms.filter((r) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'cybersec') return r.id === 'room-cybersec' || r.code === 'LAB-CYBER';
    if (categoryFilter === 'network') return r.id === 'room-network' || r.code === 'LAB-NET';
    if (categoryFilter === 'studio') return r.id === 'room-studio' || r.type === 'studio';
    if (categoryFilter === 'lounge') return r.id.startsWith('room-lounge') || r.type === 'lounge';
    return true;
  });

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="space-y-8 pb-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>ฟอร์มที่ 1 : แบบฟอร์มจองห้องปฏิบัติการและห้องประชุมไอที</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            จองห้องปฏิบัติการคอมพิวเตอร์และสตูดิโอตึกไอที
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            เลือกห้องที่ต้องการ กรอกรายละเอียดการใช้งาน ระบบจะจัดเก็บข้อมูลลงฐานข้อมูลและผูกความเป็นเจ้าของกับบัญชีคุณ
          </p>
        </div>
      </div>

      {/* Main Grid: Catalog Cards + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Rooms Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-300">ห้องปฏิบัติการและสตูดิโอที่เปิดให้บริการ</h3>
            <span className="text-xs text-slate-400 font-mono">พบ {filteredRooms.length} ห้อง</span>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2 pt-1 pb-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              ทั้งหมด ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('cybersec')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                categoryFilter === 'cybersec'
                  ? 'bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-400/20'
                  : 'bg-slate-900/80 text-cyan-300 hover:text-white border border-cyan-800/40'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>ห้องปฏิบัติการ Cybersecurity</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('network')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                categoryFilter === 'network'
                  ? 'bg-blue-400 text-slate-950 font-bold shadow-lg shadow-blue-400/20'
                  : 'bg-slate-900/80 text-blue-300 hover:text-white border border-blue-800/40'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-blue-400" />
              <span>ห้องปฏิบัติการ Network</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                categoryFilter === 'studio'
                  ? 'bg-purple-400 text-slate-950 font-bold shadow-lg shadow-purple-400/20'
                  : 'bg-slate-900/80 text-purple-300 hover:text-white border border-purple-800/40'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-purple-400" />
              <span>ห้อง Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('lounge')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                categoryFilter === 'lounge'
                  ? 'bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-400/20'
                  : 'bg-slate-900/80 text-emerald-300 hover:text-white border border-emerald-800/40'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-emerald-400" />
              <span>ห้องนั่งเล่น 4 ห้อง ({rooms.filter((r) => r.id.startsWith('room-lounge') || r.type === 'lounge').length})</span>
            </button>
          </div>

          {loadingRooms ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl glass-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                const badge = getRoomBadge(room);
                return (
                  <div
                    key={room.id}
                    onClick={() => {
                      setSelectedRoomId(room.id);
                      if (room.equipment.length > 0) {
                        setFacilities(room.equipment.slice(0, 2));
                      }
                    }}
                    className={`glass-card rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-slate-900/90 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/10'
                        : 'border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="relative w-full sm:w-32 h-28 shrink-0 overflow-hidden rounded-xl border border-white/10">
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1.5 left-1.5 font-mono text-[10px] font-bold text-white bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10">
                          {room.code}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.badgeClass}`}
                            >
                              {badge.icon}
                              <span>{badge.label}</span>
                            </span>
                            <span className="text-xs text-slate-400">ชั้น {room.floor}</span>
                          </div>
                          <span className="text-xs text-slate-300 flex items-center gap-1 bg-slate-950/50 px-2 py-0.5 rounded border border-white/5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="tabular-nums font-mono font-medium">{room.capacity} ที่นั่ง</span>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {room.name}
                        </h4>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {room.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {room.equipment.slice(0, 3).map((eq, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-950/70 text-slate-300 px-2 py-0.5 rounded border border-white/10 font-mono"
                            >
                              {eq}
                            </span>
                          ))}
                          {room.equipment.length > 3 && (
                            <span className="text-[10px] bg-slate-950/40 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                              +{room.equipment.length - 3} รายการ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Booking Form (Form 1) (5 cols) */}
        <div className="lg:col-span-5">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/15 sticky top-24 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>แบบฟอร์มส่งคำขอจองห้อง</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ห้องที่เลือก:{' '}
                  <span className="text-cyan-300 font-bold font-mono">
                    {selectedRoom ? `${selectedRoom.code} - ${selectedRoom.name}` : '-'}
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
                  ห้องที่ต้องการจอง *
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value);
                    const rm = rooms.find((r) => r.id === e.target.value);
                    if (rm && rm.equipment.length > 0) {
                      setFacilities(rm.equipment.slice(0, 2));
                    }
                  }}
                  className="w-full glass-input px-3 py-2.5 rounded-xl text-xs bg-slate-900/90 border border-white/10 text-white font-medium focus:ring-1 focus:ring-cyan-400"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white py-1">
                      [{r.code}] {r.name} (ชั้น {r.floor}, {r.capacity} ที่นั่ง)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  วันที่ต้องการใช้งาน *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    เวลาเริ่มต้น *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    เวลาสิ้นสุด *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    จำนวนผู้เข้าใช้งาน (คน) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedRoom?.capacity || 50}
                    required
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(parseInt(e.target.value) || 1)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    อาจารย์ที่ปรึกษา / ผู้รับรอง
                  </label>
                  <input
                    type="text"
                    value={advisorName}
                    onChange={(e) => setAdvisorName(e.target.value)}
                    placeholder="เช่น ดร.สมเกียรติ"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  วัตถุประสงค์การใช้งานห้อง *
                </label>
                <textarea
                  rows={2}
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="เช่น ติววิชา Advanced Algorithms & AI หรือ ทำแบบทดสอบ CTF"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  สิ่งอำนวยความสะดวกที่ต้องการเพิ่มเติม
                </label>
                <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-xs">
                  {[
                    'จอสัมผัส Smartboard 86"',
                    'Gigabit Ethernet Drop',
                    'Dedicated Hardware Firewall Sandbox',
                    'ระบบปรับอากาศรอบพิเศษ (หลัง 17:00 น.)',
                  ].map((facility) => (
                    <label key={facility} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={facilities.includes(facility)}
                        onChange={() => handleFacilityToggle(facility)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-slate-900"
                      />
                      <span>{facility}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Data masking / ownership notice */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>ความปลอดภัยและการเป็นเจ้าของข้อมูล (Data Ownership)</span>
                </div>
                <p>
                  รายการนี้จะผูกกับบัญชีของคุณ ({user ? user.email : 'กรุณาเข้าสู่ระบบ'}) ผู้ใช้อื่นจะไม่สามารถแก้ไขหรือลบรายการจองของคุณได้
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>กำลังบันทึกข้อมูล...</span>
                ) : user ? (
                  <span>ยืนยันการส่งคำขอจองห้อง (บันทึกลงฐานข้อมูล)</span>
                ) : (
                  <span>เข้าสู่ระบบก่อนทำการจองห้อง</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
