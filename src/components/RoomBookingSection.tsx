import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Room } from '../types/index.ts';
import { Calendar, Clock, Users, CheckCircle2, AlertCircle, Sparkles, Building2, ShieldAlert } from 'lucide-react';

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
        if (res.ok) {
          const data = await res.json();
          setRooms(data.rooms);
          if (data.rooms.length > 0) {
            setSelectedRoomId(data.rooms[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load rooms', err);
      } finally {
        setLoadingRooms(false);
      }
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

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกการจอง');
      } else {
        setSuccess('ส่งคำขอจองห้องสำเร็จ ข้อมูลถูกบันทึกลงระบบเรียบร้อยแล้ว');
        setPurpose('');
        onBookingSuccess();
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับระบบได้');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h3 className="text-sm font-semibold text-slate-300">ห้องปฏิบัติการที่เปิดให้บริการ</h3>

          {loadingRooms ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl glass-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`glass-card rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-slate-900/80 ring-2 ring-cyan-500/30'
                        : 'border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <img
                        src={room.imageUrl}
                        alt={room.name}
                        className="w-full sm:w-28 h-24 rounded-xl object-cover border border-white/10 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/60">
                              {room.code}
                            </span>
                            <span className="text-xs text-slate-400">ชั้น {room.floor}</span>
                          </div>
                          <span className="text-xs text-slate-300 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="tabular-nums font-mono">{room.capacity} ที่นั่ง</span>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white">{room.name}</h4>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {room.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {room.equipment.slice(0, 3).map((eq, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-950/60 text-slate-300 px-2 py-0.5 rounded border border-white/5 font-mono"
                            >
                              {eq}
                            </span>
                          ))}
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
