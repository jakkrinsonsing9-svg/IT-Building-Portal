import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { RoomBooking, EquipmentRequest } from '../types/index.ts';
import { clientStorage } from '../services/clientStorage.ts';
import {
  Calendar,
  Clock,
  Laptop,
  Building2,
  Trash2,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  UserCheck,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Flame,
  Star,
} from 'lucide-react';

interface MyRecordsCRUDProps {
  openAuthModal: () => void;
  refreshTrigger: number;
  onOpenFeedback?: (target: { type: 'room' | 'equipment' | 'overall'; id?: string; name: string }) => void;
}

export const MyRecordsCRUD: React.FC<MyRecordsCRUDProps> = ({
  openAuthModal,
  refreshTrigger,
  onOpenFeedback,
}) => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'equipment'>('bookings');
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [equipmentRequests, setEquipmentRequests] = useState<EquipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingBooking, setEditingBooking] = useState<RoomBooking | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editAttendees, setEditAttendees] = useState(1);

  // Edit Equipment Modal State
  const [editingEqReq, setEditingEqReq] = useState<EquipmentRequest | null>(null);
  const [editBorrowDate, setEditBorrowDate] = useState('');
  const [editReturnDate, setEditReturnDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editEqPurpose, setEditEqPurpose] = useState('');

  // IDOR simulation result modal
  const [idorResult, setIdorResult] = useState<any | null>(null);
  const [isSimulatingIdor, setIsSimulatingIdor] = useState(false);

  // Notification message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let loadedRemote = false;
    try {
      const [resB, resE] = await Promise.all([
        fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/equipment-requests', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const typeB = resB.headers.get('content-type') || '';
      const typeE = resE.headers.get('content-type') || '';

      if (resB.ok && typeB.includes('application/json')) {
        const dataB = await resB.json();
        setBookings(dataB.bookings);
        loadedRemote = true;
      }
      if (resE.ok && typeE.includes('application/json')) {
        const dataE = await resE.json();
        setEquipmentRequests(dataE.requests);
        loadedRemote = true;
      }
    } catch (err) {
      console.warn('Backend unavailable, loading user records from clientStorage fallback:', err);
    }

    if (!loadedRemote) {
      setBookings(clientStorage.getBookings(user));
      setEquipmentRequests(clientStorage.getEquipmentRequests(user));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token, refreshTrigger]);

  const handleEditBookingClick = (b: RoomBooking) => {
    setEditingBooking(b);
    setEditDate(b.date);
    setEditStartTime(b.startTime);
    setEditEndTime(b.endTime);
    setEditPurpose(b.purpose);
    setEditAttendees(b.attendeesCount);
  };

  const handleSaveBookingEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking || !token || !user) return;

    try {
      const res = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: editDate,
          startTime: editStartTime,
          endTime: editEndTime,
          purpose: editPurpose,
          attendeesCount: editAttendees,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          setMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการแก้ไข' });
        } else {
          setMessage({ type: 'success', text: 'บันทึกการแก้ไขข้อมูลการจองสำเร็จ' });
          setEditingBooking(null);
          fetchData();
        }
        return;
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch {
      // Local fallback
      const localRes = clientStorage.updateBooking(
        editingBooking.id,
        {
          date: editDate,
          startTime: editStartTime,
          endTime: editEndTime,
          purpose: editPurpose,
          attendeesCount: editAttendees,
        },
        user
      );
      if (localRes.success) {
        setMessage({ type: 'success', text: 'บันทึกการแก้ไขข้อมูลการจองสำเร็จ (Local Secured)' });
        setEditingBooking(null);
        fetchData();
      } else {
        setMessage({ type: 'error', text: localRes.error || 'เกิดข้อผิดพลาดในการแก้ไข' });
      }
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!token || !user) return;
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิก/ลบรายการจองนี้?')) return;

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          setMessage({ type: 'error', text: data.error || 'ไม่สามารถลบรายการได้' });
        } else {
          setMessage({ type: 'success', text: 'ยกเลิกรายการจองเรียบร้อยแล้ว' });
          fetchData();
        }
        return;
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch {
      const localRes = clientStorage.deleteBooking(id, user);
      if (localRes.success) {
        setMessage({ type: 'success', text: 'ยกเลิกรายการจองเรียบร้อยแล้ว (Local Secured)' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: localRes.error || 'ไม่สามารถลบรายการได้' });
      }
    }
  };

  const handleEditEqClick = (r: EquipmentRequest) => {
    setEditingEqReq(r);
    setEditBorrowDate(r.borrowDate);
    setEditReturnDate(r.expectedReturnDate);
    setEditLocation(r.usageLocation);
    setEditEqPurpose(r.projectPurpose);
  };

  const handleSaveEqEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEqReq || !token || !user) return;

    try {
      const res = await fetch(`/api/equipment-requests/${editingEqReq.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          borrowDate: editBorrowDate,
          expectedReturnDate: editReturnDate,
          usageLocation: editLocation,
          projectPurpose: editEqPurpose,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          setMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการแก้ไข' });
        } else {
          setMessage({ type: 'success', text: 'บันทึกการแก้ไขคำขอยืมอุปกรณ์สำเร็จ' });
          setEditingEqReq(null);
          fetchData();
        }
        return;
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch {
      const localRes = clientStorage.updateEquipmentRequest(
        editingEqReq.id,
        {
          borrowDate: editBorrowDate,
          expectedReturnDate: editReturnDate,
          usageLocation: editLocation,
          projectPurpose: editEqPurpose,
        },
        user
      );
      if (localRes.success) {
        setMessage({ type: 'success', text: 'บันทึกการแก้ไขคำขอยืมอุปกรณ์สำเร็จ (Local Secured)' });
        setEditingEqReq(null);
        fetchData();
      } else {
        setMessage({ type: 'error', text: localRes.error || 'เกิดข้อผิดพลาดในการแก้ไข' });
      }
    }
  };

  const handleDeleteEq = async (id: string) => {
    if (!token || !user) return;
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอยืมอุปกรณ์นี้?')) return;

    try {
      const res = await fetch(`/api/equipment-requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          setMessage({ type: 'error', text: data.error || 'ไม่สามารถยกเลิกคำขอได้' });
        } else {
          setMessage({ type: 'success', text: 'ยกเลิกคำขอยืมอุปกรณ์และคืนสต็อกเรียบร้อย' });
          fetchData();
        }
        return;
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch {
      const localRes = clientStorage.deleteEquipmentRequest(id, user);
      if (localRes.success) {
        setMessage({ type: 'success', text: 'ยกเลิกคำขอยืมอุปกรณ์เรียบร้อย (Local Secured)' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: localRes.error || 'ไม่สามารถยกเลิกคำขอได้' });
      }
    }
  };

  // Simulate IDOR Attack (Insecure Direct Object Reference)
  const handleSimulateIDOR = async () => {
    if (!token) {
      openAuthModal();
      return;
    }

    setIsSimulatingIdor(true);
    try {
      const res = await fetch('/api/security/simulate-idor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setIdorResult({
        status: res.status,
        data,
      });
    } catch {
      alert('เกิดข้อผิดพลาดในการจำลองการโจมตี');
    } finally {
      setIsSimulatingIdor(false);
    }
  };

  if (!user) {
    return (
      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/10 text-center max-w-xl mx-auto my-8">
        <Lock className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูล</h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          ระบบจำเป็นต้องยืนยันตัวตนเพื่อตรวจสอบความเป็นเจ้าของข้อมูล (Data Ownership) ตามข้อกำหนดความปลอดภัย
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/30 cursor-pointer"
        >
          เข้าสู่ระบบ / ลงทะเบียน
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header and IDOR Test Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>ฟีเจอร์ที่ 3 : CRUD แบบมีเจ้าของข้อมูล (Resource Ownership & IDOR Protection)</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            รายการของฉันและการตรวจสอบสิทธิ์ความเป็นเจ้าของ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ผู้ใช้ <span className="text-cyan-300 font-mono font-semibold">{user.email}</span> สามารถแก้ไข/ลบได้เฉพาะข้อมูลของตนเองเท่านั้น ข้อมูลผู้ใช้อื่นจะถูกบล็อกและปิดบัง PII
          </p>
        </div>

        {/* Live IDOR Attack simulation trigger - ซ่อนไว้ตามคำขอของผู้ใช้งาน */}
        <button
          onClick={handleSimulateIDOR}
          disabled={isSimulatingIdor}
          className="hidden px-4 py-2.5 rounded-xl text-xs font-semibold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer transition-all self-start md:self-auto"
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>{isSimulatingIdor ? 'กำลังทดสอบ...' : '⚡ ทดสอบเจาะระบบ IDOR (จำลองแฮกข้อมูลผู้อื่น)'}</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/20 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-950/60 p-1 border border-white/10 max-w-md">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'bookings'
              ? 'bg-cyan-500/30 text-white border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>รายการจองห้องปฏิบัติการ ({bookings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'equipment'
              ? 'bg-cyan-500/30 text-white border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>รายการขอยืมอุปกรณ์ ({equipmentRequests.length})</span>
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'bookings' ? (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-xs">
              ยังไม่มีประวัติการจองห้องในระบบ
            </div>
          ) : (
            bookings.map((b: any) => {
              const isOwner = b.userId === user.id;
              const isAdmin = user.role === 'admin';
              const canEditOrDelete = isOwner || isAdmin;

              return (
                <div
                  key={b.id}
                  className={`glass-card rounded-2xl p-5 border transition-all ${
                    isOwner
                      ? 'border-cyan-500/40 bg-slate-900/80 ring-1 ring-cyan-500/20'
                      : 'border-white/10 bg-slate-900/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                        {b.roomCode}
                      </span>
                      <h4 className="text-sm font-bold text-white">{b.roomName}</h4>
                      <span className="text-xs text-slate-400 font-mono">#{b.id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Ownership badge */}
                      {isOwner ? (
                        <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>เจ้าของ: คุณ</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/60 border border-white/5 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>เจ้าของ: {b.userName.split(' ')[0]} (ผู้อื่น)</span>
                        </span>
                      )}

                      {/* Status badge */}
                      <span
                        className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                          b.status === 'approved'
                            ? 'text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                            : b.status === 'pending'
                            ? 'text-amber-300 bg-amber-950/90 border border-amber-500/40'
                            : 'text-rose-300 bg-rose-950/90 border border-rose-500/40'
                        }`}
                      >
                        {b.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {b.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                        {b.status === 'rejected' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                        <span>
                          {b.status === 'approved'
                            ? 'อนุมัติแล้ว (Approved)'
                            : b.status === 'pending'
                            ? 'รออนุมัติ (Pending)'
                            : 'ไม่อนุมัติ (Rejected)'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Status Banner */}
                  {b.status === 'approved' && (
                    <div className="my-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-300">ได้รับการอนุมัติเรียบร้อยแล้ว</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">พร้อมใช้งาน</span>
                        </div>
                        <p className="text-[11px] text-emerald-400/90 mt-0.5">
                          คุณสามารถเข้าใช้งานห้องปฏิบัติการนี้ได้ตามวันและเวลาที่ระบุ
                        </p>
                        {b.adminNote && (
                          <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[11px] text-slate-200">
                            <span className="text-emerald-400 font-semibold">ข้อความจากแอดมิน:</span> {b.adminNote}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {b.status === 'pending' && (
                    <div className="my-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-[11px]">
                        คำขอนี้ส่งถึงผู้ดูแลระบบแล้ว อยู่ระหว่างรอตรวจสอบและอนุมัติความพร้อมของห้อง
                      </span>
                    </div>
                  )}

                  {b.status === 'rejected' && (
                    <div className="my-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-semibold text-rose-300">คำขอจองถูกปฏิเสธ</span>
                        {b.adminNote ? (
                          <p className="text-[11px] text-rose-200/90 mt-0.5">
                            <span className="font-semibold">เหตุผล:</span> {b.adminNote}
                          </p>
                        ) : (
                          <p className="text-[11px] text-rose-300/80 mt-0.5">
                            ช่วงเวลาดังกล่าวอาจติดภารกิจอื่น หรือห้องไม่พร้อมให้บริการ
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[11px]">วันและเวลา:</span>
                      <span className="font-mono text-white">
                        {b.date} · {b.startTime} - {b.endTime} น.
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">วัตถุประสงค์:</span>
                      <span className="text-white line-clamp-1">{b.purpose}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        ข้อมูลติดต่อ (Masked PII):
                      </span>
                      <span className="font-mono text-cyan-300">
                        {b.userPhoneDisplay || b.userPhone}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons (CRUD permissions enforced) */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {canEditOrDelete
                        ? 'คุณมีสิทธิ์แก้ไขหรือยกเลิกรายการนี้'
                        : '⛔ สิทธิ์ถูกบล็อก: ผู้ใช้ A ไม่สามารถแก้ไขหรือลบข้อมูลของผู้ใช้ B ได้'}
                    </span>

                    <div className="flex items-center gap-2">
                      {onOpenFeedback && (
                        <button
                          type="button"
                          onClick={() => onOpenFeedback({ type: 'room', id: b.roomId, name: b.roomName })}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 transition-colors cursor-pointer"
                          title="ให้คะแนนและประเมินความพึงพอใจการใช้ห้องนี้"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>ประเมิน</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleEditBookingClick(b)}
                        disabled={!canEditOrDelete}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          canEditOrDelete
                            ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 cursor-pointer'
                            : 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไข (Update)</span>
                      </button>

                      <button
                        onClick={() => handleDeleteBooking(b.id)}
                        disabled={!canEditOrDelete}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          canEditOrDelete
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 cursor-pointer'
                            : 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ยกเลิก (Delete)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {equipmentRequests.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-xs">
              ยังไม่มีประวัติการขอยืมอุปกรณ์ในระบบ
            </div>
          ) : (
            equipmentRequests.map((r: any) => {
              const isOwner = r.userId === user.id;
              const isAdmin = user.role === 'admin';
              const canEditOrDelete = isOwner || isAdmin;

              return (
                <div
                  key={r.id}
                  className={`glass-card rounded-2xl p-5 border transition-all ${
                    isOwner
                      ? 'border-cyan-500/40 bg-slate-900/80 ring-1 ring-cyan-500/20'
                      : 'border-white/10 bg-slate-900/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                        {r.quantity} ชิ้น
                      </span>
                      <h4 className="text-sm font-bold text-white">{r.equipmentName}</h4>
                      <span className="text-xs text-slate-400 font-mono">#{r.id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>เจ้าของ: คุณ</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/60 border border-white/5 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>เจ้าของ: {r.userName.split(' ')[0]}</span>
                        </span>
                      )}

                      <span
                        className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                          r.status === 'approved'
                            ? 'text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                            : r.status === 'borrowed'
                            ? 'text-cyan-300 bg-cyan-950/90 border border-cyan-500/40'
                            : r.status === 'pending'
                            ? 'text-amber-300 bg-amber-950/90 border border-amber-500/40'
                            : r.status === 'returned'
                            ? 'text-slate-300 bg-slate-900 border border-white/20'
                            : 'text-rose-300 bg-rose-950 border border-rose-800/40'
                        }`}
                      >
                        {r.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {r.status === 'borrowed' && <Laptop className="w-3.5 h-3.5 text-cyan-400" />}
                        {r.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                        {r.status === 'returned' && <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />}
                        {r.status === 'rejected' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                        <span>
                          {r.status === 'approved'
                            ? 'อนุมัติแล้ว (Approved)'
                            : r.status === 'borrowed'
                            ? 'กำลังยืมใช้งาน (Borrowed)'
                            : r.status === 'pending'
                            ? 'รออนุมัติ (Pending)'
                            : r.status === 'returned'
                            ? 'ส่งคืนเรียบร้อย (Returned)'
                            : 'ไม่อนุมัติ (Rejected)'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Equipment Status Banner */}
                  {r.status === 'approved' && (
                    <div className="my-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-300">ได้รับการอนุมัติคำขอยืมแล้ว</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">รอรับของ</span>
                        </div>
                        <p className="text-[11px] text-emerald-400/90 mt-0.5">
                          กรุณาติดต่อรับอุปกรณ์ที่ห้องปฏิบัติการส่วนกลาง พร้อมแสดงบัตรประจำตัวประชาชน/นักศึกษา
                        </p>
                      </div>
                    </div>
                  )}

                  {r.status === 'borrowed' && (
                    <div className="my-2.5 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-[11px]">
                        รับอุปกรณ์แล้ว อยู่ระหว่างการยืมใช้งาน (กำหนดส่งคืน: <span className="font-mono font-semibold text-cyan-300">{r.expectedReturnDate}</span>)
                      </span>
                    </div>
                  )}

                  {r.status === 'pending' && (
                    <div className="my-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-[11px]">
                        คำขอยืมส่งถึงผู้ดูแลระบบแล้ว อยู่ระหว่างรอตรวจสอบคลังอุปกรณ์และอนุมัติ
                      </span>
                    </div>
                  )}

                  {r.status === 'returned' && (
                    <div className="my-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-[11px]">
                        ส่งคืนอุปกรณ์เรียบร้อยแล้ว การยืมเสร็จสมบูรณ์
                      </span>
                    </div>
                  )}

                  <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[11px]">ระยะเวลายืม:</span>
                      <span className="font-mono text-white">
                        {r.borrowDate} ถึง {r.expectedReturnDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">สถานที่ใช้งาน:</span>
                      <span className="text-white line-clamp-1">{r.usageLocation}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        เลขบัตร ปชช. (Masked PII):
                      </span>
                      <span className="font-mono text-cyan-300">
                        {r.userCitizenIdDisplay || r.userCitizenId}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {canEditOrDelete
                        ? 'คุณมีสิทธิ์แก้ไขหรือยกเลิกรายการนี้'
                        : '⛔ สิทธิ์ถูกบล็อก: คุณไม่สามารถแก้ไขหรือลบคำขอยืมของผู้อื่นได้'}
                    </span>

                    <div className="flex items-center gap-2">
                      {onOpenFeedback && (
                        <button
                          type="button"
                          onClick={() => onOpenFeedback({ type: 'equipment', id: r.equipmentId, name: r.equipmentName })}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 transition-colors cursor-pointer"
                          title="ให้คะแนนและประเมินความพึงพอใจการยืมอุปกรณ์นี้"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>ประเมิน</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleEditEqClick(r)}
                        disabled={!canEditOrDelete}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          canEditOrDelete
                            ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 cursor-pointer'
                            : 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>

                      <button
                        onClick={() => handleDeleteEq(r.id)}
                        disabled={!canEditOrDelete}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          canEditOrDelete
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 cursor-pointer'
                            : 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ยกเลิก</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-white/15 text-slate-100 shadow-2xl">
            <button
              onClick={() => setEditingBooking(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              แก้ไขข้อมูลการจองห้อง {editingBooking.roomCode}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              อัปเดตข้อมูลการจองของตนเอง (รหัส #{editingBooking.id})
            </p>

            <form onSubmit={handleSaveBookingEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">วันที่จอง</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">เวลาเริ่ม</label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">เวลาสิ้นสุด</label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  จำนวนผู้เข้าใช้
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editAttendees}
                  onChange={(e) => setEditAttendees(parseInt(e.target.value) || 1)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">วัตถุประสงค์</label>
                <textarea
                  rows={2}
                  required
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Equipment Request Modal */}
      {editingEqReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-white/15 text-slate-100 shadow-2xl">
            <button
              onClick={() => setEditingEqReq(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              แก้ไขคำขอยืม {editingEqReq.equipmentName}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              อัปเดตข้อมูลคำขอยืมของตนเอง (รหัส #{editingEqReq.id})
            </p>

            <form onSubmit={handleSaveEqEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">วันที่เริ่มยืม</label>
                  <input
                    type="date"
                    required
                    value={editBorrowDate}
                    onChange={(e) => setEditBorrowDate(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">กำหนดคืน</label>
                  <input
                    type="date"
                    required
                    value={editReturnDate}
                    onChange={(e) => setEditReturnDate(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">สถานที่ใช้งาน</label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">วัตถุประสงค์</label>
                <textarea
                  rows={2}
                  required
                  value={editEqPurpose}
                  onChange={(e) => setEditEqPurpose(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEqReq(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IDOR Simulation Live Intercept Modal */}
      {idorResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/40 text-slate-100 shadow-2xl">
            <button
              onClick={() => setIdorResult(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  ผลการจำลองการโจมตี IDOR (OWASP A01)
                </h3>
                <span className="text-[11px] font-mono text-amber-300">
                  HTTP Status: {idorResult.status} Forbidden (บล็อกสำเร็จ)
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-xs font-mono">
              <div className="text-emerald-400 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>ระบบรักษาความปลอดภัยดักจับการโจมตีได้ 100%!</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">
                {idorResult.data.message || idorResult.data.error}
              </p>
              {idorResult.data.attackDetails && (
                <div className="pt-2 border-t border-white/10 space-y-1 text-[11px] text-slate-400">
                  <p>
                    • Target ID:{' '}
                    <span className="text-cyan-300">{idorResult.data.attackDetails.targetBookingId}</span>
                  </p>
                  <p>
                    • เจ้าของข้อมูลที่แท้จริง:{' '}
                    <span className="text-cyan-300">{idorResult.data.attackDetails.legitimateOwner}</span>
                  </p>
                  <p>
                    • บันทึกลง Audit Trail:{' '}
                    <span className="text-emerald-400">บันทึกลงฐานข้อมูล Security Log เรียบร้อย</span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIdorResult(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/15"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
