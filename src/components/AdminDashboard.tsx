import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { RoomBooking, EquipmentRequest, SecurityAuditLog } from '../types/index.ts';
import { clientStorage } from '../services/clientStorage.ts';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Laptop,
  Building2,
  Users,
  Activity,
  PlusCircle,
  FileText,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Image as ImageIcon,
  Upload,
  Trash2,
  Camera
} from 'lucide-react';

const ROOM_IMAGE_PRESETS = [
  { label: 'ห้องแล็บมาตรฐาน', url: '/src/assets/images/it_lab_interior_1791567709768.jpg' },
  { label: 'Cybersecurity Lab', url: '/src/assets/images/cybersecurity_lab_1791646568756.jpg' },
  { label: 'Network & System Lab', url: '/src/assets/images/network_lab_1791646586644.jpg' },
  { label: 'Media Studio', url: '/src/assets/images/media_studio_1791646607451.jpg' },
  { label: 'Student Lounge', url: '/src/assets/images/student_lounge_1791646630711.jpg' },
];

const EQUIPMENT_IMAGE_PRESETS = [
  { label: 'อุปกรณ์ไอทีทั่วไป', url: '/src/assets/images/it_tech_devices_1791567729951.jpg' },
  { label: 'กล้องสตูดิโอ 4K', url: '/src/assets/images/equipment_camera_1791648975276.jpg' },
  { label: 'การ์ดจอ eGPU RTX', url: '/src/assets/images/equipment_gpu_1791648914162.jpg' },
  { label: 'คีย์บอร์ดกลไก', url: '/src/assets/images/equipment_keyboard_1791648890529.jpg' },
  { label: 'เมาส์เกมมิ่ง Ergonomic', url: '/src/assets/images/equipment_mouse_1791648865268.jpg' },
  { label: 'สายแลน & Network', url: '/src/assets/images/equipment_lancable_1791648939295.jpg' },
];

interface AdminDashboardProps {
  onOpenSupabaseModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenSupabaseModal }) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [equipmentRequests, setEquipmentRequests] = useState<EquipmentRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'equipment' | 'add-item' | 'audit'>(
    'bookings'
  );

  // Admin note modal
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Add Room form state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState(3);
  const [newRoomCapacity, setNewRoomCapacity] = useState(30);
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomImage, setNewRoomImage] = useState<string>('');

  // Add Equipment form state
  const [newEqName, setNewEqName] = useState('');
  const [newEqCategory, setNewEqCategory] = useState<'computing' | 'network' | 'vr_ar' | 'media'>('computing');
  const [newEqSerial, setNewEqSerial] = useState('');
  const [newEqQty, setNewEqQty] = useState(2);
  const [newEqSpecs, setNewEqSpecs] = useState('');
  const [newEqImage, setNewEqImage] = useState<string>('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper to read and auto-resize uploaded image file into lightweight base64 data URL
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setter(dataUrl);
        } else {
          setter(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const fetchAdminData = async () => {
    if (!token || user?.role !== 'admin') return;
    setLoading(true);
    let loadedRemote = false;
    try {
      const [resStats, resBkg, resEq, resLogs] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/equipment-requests', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const tStats = resStats.headers.get('content-type') || '';
      const tBkg = resBkg.headers.get('content-type') || '';
      const tEq = resEq.headers.get('content-type') || '';
      const tLogs = resLogs.headers.get('content-type') || '';

      if (resStats.ok && tStats.includes('application/json')) setStats((await resStats.json()).stats);
      if (resBkg.ok && tBkg.includes('application/json')) setBookings((await resBkg.json()).bookings);
      if (resEq.ok && tEq.includes('application/json')) setEquipmentRequests((await resEq.json()).requests);
      if (resLogs.ok && tLogs.includes('application/json')) setAuditLogs((await resLogs.json()).logs);
      loadedRemote = resBkg.ok && resEq.ok;
    } catch (err) {
      console.warn('Backend unavailable, loading admin data from clientStorage fallback:', err);
    }

    if (!loadedRemote) {
      const localBookings = clientStorage.getBookings(user);
      const localEq = clientStorage.getEquipmentRequests(user);
      const localLogs = clientStorage.getAuditLogs();
      setBookings(localBookings);
      setEquipmentRequests(localEq);
      setAuditLogs(localLogs);
      setStats({
        totalBookings: localBookings.length,
        pendingBookings: localBookings.filter((b) => b.status === 'pending').length,
        totalEquipmentRequests: localEq.length,
        pendingEquipmentRequests: localEq.filter((r) => r.status === 'pending').length,
        totalRooms: clientStorage.getRooms().length,
        totalEquipmentUnits: clientStorage.getEquipment().reduce((acc, curr) => acc + curr.totalQuantity, 0),
        totalUsers: 12,
        securityEventsCount: localLogs.length,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, [token, user]);

  const handleBookingStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    if (!token) return;

    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          adminNote: adminNoteInput.trim() || undefined,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok) {
          setMessage({ type: 'success', text: `ปรับสถานะรายการจองเป็น ${status} สำเร็จ` });
          setProcessingBookingId(null);
          setAdminNoteInput('');
          fetchAdminData();
        } else {
          setMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาด' });
        }
        return;
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch {
      clientStorage.updateBookingStatus(id, status, adminNoteInput.trim() || undefined);
      setMessage({ type: 'success', text: `ปรับสถานะรายการจองเป็น ${status} สำเร็จ (Local Secured)` });
      setProcessingBookingId(null);
      setAdminNoteInput('');
      fetchAdminData();
    }
  };

  const handleEquipmentStatusChange = async (
    id: string,
    status: 'approved' | 'borrowed' | 'returned' | 'rejected'
  ) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/equipment-requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        if (res.ok) {
          setMessage({ type: 'success', text: `ปรับสถานะคำขอยืมเป็น ${status} สำเร็จ` });
          fetchAdminData();
        } else {
          setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการปรับสถานะ' });
        }
        return;
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch {
      clientStorage.updateEquipmentRequestStatus(id, status);
      setMessage({ type: 'success', text: `ปรับสถานะคำขอยืมเป็น ${status} สำเร็จ (Local Secured)` });
      fetchAdminData();
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRoomName,
          code: newRoomCode,
          floor: newRoomFloor,
          capacity: newRoomCapacity,
          description: newRoomDescription,
          equipment: ['Interactive Display', 'Gigabit LAN'],
          imageUrl: newRoomImage || '/src/assets/images/it_lab_interior_1791567709768.jpg',
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        if (res.ok) {
          setMessage({ type: 'success', text: 'เพิ่มห้องปฏิบัติการใหม่เรียบร้อยแล้ว' });
          setNewRoomName('');
          setNewRoomCode('');
          setNewRoomDescription('');
          setNewRoomImage('');
          fetchAdminData();
        } else {
          setMessage({ type: 'error', text: 'ไม่สามารถเพิ่มห้องใหม่ได้' });
        }
        return;
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch {
      clientStorage.addRoom({
        id: `room-${Date.now()}`,
        name: newRoomName,
        code: newRoomCode,
        floor: newRoomFloor,
        capacity: newRoomCapacity,
        description: newRoomDescription,
        type: 'lab',
        equipment: ['Interactive Display', 'Gigabit LAN'],
        status: 'available',
        imageUrl: newRoomImage || '/src/assets/images/it_lab_interior_1791567709768.jpg',
      });
      setMessage({ type: 'success', text: 'เพิ่มห้องปฏิบัติการใหม่เรียบร้อยแล้ว (Local Secured)' });
      setNewRoomName('');
      setNewRoomCode('');
      setNewRoomDescription('');
      setNewRoomImage('');
      fetchAdminData();
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch('/api/admin/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newEqName,
          category: newEqCategory,
          serialNumber: newEqSerial,
          totalQuantity: newEqQty,
          specs: newEqSpecs,
          imageUrl: newEqImage || '/src/assets/images/it_tech_devices_1791567729951.jpg',
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        if (res.ok) {
          setMessage({ type: 'success', text: 'เพิ่มอุปกรณ์ส่วนกลางใหม่เรียบร้อยแล้ว' });
          setNewEqName('');
          setNewEqSerial('');
          setNewEqSpecs('');
          setNewEqImage('');
          fetchAdminData();
        } else {
          setMessage({ type: 'error', text: 'ไม่สามารถเพิ่มอุปกรณ์ได้' });
        }
        return;
      }
      throw new Error(`Non-JSON response: ${res.status}`);
    } catch {
      clientStorage.addEquipment({
        id: `eq-${Date.now()}`,
        name: newEqName,
        category: newEqCategory,
        serialNumber: newEqSerial,
        specs: newEqSpecs,
        totalQuantity: newEqQty,
        availableQuantity: newEqQty,
        location: 'ห้องพัสดุไอที อาคาร 3',
        imageUrl: newEqImage || '/src/assets/images/it_tech_devices_1791567729951.jpg',
      });
      setMessage({ type: 'success', text: 'เพิ่มอุปกรณ์ส่วนกลางใหม่เรียบร้อยแล้ว (Local Secured)' });
      setNewEqName('');
      setNewEqSerial('');
      setNewEqSpecs('');
      setNewEqImage('');
      fetchAdminData();
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center max-w-lg mx-auto my-12 border border-rose-500/30">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">เข้าถึงไม่ได้ (Access Forbidden)</h3>
        <p className="text-xs text-slate-400 mb-4">
          หน้านี้สงวนสิทธิ์สำหรับบทบาทผู้ดูแลระบบ (Admin) เท่านั้น กรุณาสลับบัญชีเป็นผู้ดูแลระบบในแถบด้านบน
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>ฟีเจอร์ที่ 6 : หน้าผู้ดูแลระบบ (IT Building Admin Console)</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            แผงควบคุมและอนุมัติคำขอของผู้ดูแลระบบ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            อนุมัติหรือปฏิเสธคำขอจองห้อง, จัดการอุปกรณ์ที่ถูกยืม, ตรวจสอบผู้ใช้ และดู Security Audit Trail
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={fetchAdminData}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 glass-card hover:bg-white/10 flex items-center gap-2 border border-white/10 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs border flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/20 border-rose-500/30 text-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs">คำขอจองห้องรออนุมัติ</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
              {stats.pendingBookings}
            </div>
            <span className="text-[11px] text-slate-400">ทั้งหมด {stats.totalBookings} รายการ</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs">คำขอยืมของรออนุมัติ</span>
              <Laptop className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">
              {stats.pendingEquipmentRequests}
            </div>
            <span className="text-[11px] text-slate-400">กำลังยืมอยู่ {stats.activeBorrowedEquipment} รายการ</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs">ผู้ใช้ที่ลงทะเบียน</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300 tabular-nums">
              {stats.totalUsers}
            </div>
            <span className="text-[11px] text-slate-400">RBAC: 1 Admin, {stats.totalUsers - 1} Users</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs">อัตราการใช้งานห้อง</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-300 tabular-nums">
              {stats.utilizationRate}%
            </div>
            <span className="text-[11px] text-slate-400">จาก 5 ห้องปฏิบัติการ</span>
          </div>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex rounded-xl bg-slate-950/70 p-1 border border-white/10 max-w-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`py-2 px-4 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'bookings'
              ? 'bg-amber-500/25 text-amber-200 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          อนุมัติจองห้อง ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`py-2 px-4 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'equipment'
              ? 'bg-amber-500/25 text-amber-200 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          อนุมัติยืมอุปกรณ์ ({equipmentRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('add-item')}
          className={`py-2 px-4 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'add-item'
              ? 'bg-amber-500/25 text-amber-200 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          เพิ่มห้อง / ครุภัณฑ์
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2 px-4 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            activeTab === 'audit'
              ? 'bg-amber-500/25 text-amber-200 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Security Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Bookings Approvals */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
                    {b.roomCode}
                  </span>
                  <h4 className="text-sm font-bold text-white">{b.roomName}</h4>
                  <span className="text-xs text-slate-400 font-mono">#{b.id}</span>
                </div>
                <p className="text-xs text-slate-300">
                  ผู้ขอจอง: <span className="text-white font-medium">{b.userName}</span> ({b.userEmail}) · โทร:{' '}
                  <span className="font-mono text-cyan-300">{b.userPhone}</span>
                </p>
                <p className="text-xs text-slate-400">
                  วันที่: <span className="font-mono text-white">{b.date}</span> เวลา{' '}
                  <span className="font-mono text-white">{b.startTime} - {b.endTime}</span> · วัตถุประสงค์: "{b.purpose}"
                </p>
                {b.adminNote && (
                  <p className="text-[11px] text-amber-300 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/30">
                    หมายเหตุแอดมิน: {b.adminNote}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-mono px-2.5 py-1 rounded font-semibold ${
                    b.status === 'approved'
                      ? 'text-emerald-300 bg-emerald-950 border border-emerald-800/40'
                      : b.status === 'pending'
                      ? 'text-amber-300 bg-amber-950 border border-amber-800/40'
                      : 'text-rose-300 bg-rose-950 border border-rose-800/40'
                  }`}
                >
                  {b.status === 'approved' ? 'อนุมัติแล้ว' : b.status === 'pending' ? 'รออนุมัติ' : 'ปฏิเสธ'}
                </span>

                {b.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleBookingStatusChange(b.id, 'approved')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-200 bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 cursor-pointer"
                    >
                      อนุมัติ (Approve)
                    </button>
                    <button
                      onClick={() => handleBookingStatusChange(b.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-200 bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/40 cursor-pointer"
                    >
                      ปฏิเสธ (Reject)
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Equipment Approvals */}
      {activeTab === 'equipment' && (
        <div className="space-y-3">
          {equipmentRequests.map((r) => (
            <div
              key={r.id}
              className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/60">
                    {r.quantity} ชิ้น
                  </span>
                  <h4 className="text-sm font-bold text-white">{r.equipmentName}</h4>
                  <span className="text-xs text-slate-400 font-mono">#{r.id}</span>
                </div>
                <p className="text-xs text-slate-300">
                  ผู้ขอยืม: <span className="text-white font-medium">{r.userName}</span> · บัตร ปชช.:{' '}
                  <span className="font-mono text-cyan-300">{r.userCitizenId}</span> · โทร: {r.userPhone}
                </p>
                <p className="text-xs text-slate-400">
                  ยืมวันที่: <span className="font-mono text-white">{r.borrowDate}</span> ถึง{' '}
                  <span className="font-mono text-white">{r.expectedReturnDate}</span> · สถานที่: {r.usageLocation}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-mono px-2.5 py-1 rounded font-semibold ${
                    r.status === 'approved'
                      ? 'text-emerald-300 bg-emerald-950 border border-emerald-800/40'
                      : r.status === 'borrowed'
                      ? 'text-cyan-300 bg-cyan-950 border border-cyan-800/40'
                      : r.status === 'returned'
                      ? 'text-slate-400 bg-slate-900 border border-white/10'
                      : r.status === 'pending'
                      ? 'text-amber-300 bg-amber-950 border border-amber-800/40'
                      : 'text-rose-300 bg-rose-950 border border-rose-800/40'
                  }`}
                >
                  {r.status === 'approved'
                    ? 'อนุมัติแล้ว'
                    : r.status === 'borrowed'
                    ? 'กำลังยืม'
                    : r.status === 'returned'
                    ? 'ส่งคืนแล้ว'
                    : r.status === 'pending'
                    ? 'รออนุมัติ'
                    : 'ปฏิเสธ'}
                </span>

                {r.status === 'pending' && (
                  <button
                    onClick={() => handleEquipmentStatusChange(r.id, 'approved')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-200 bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 cursor-pointer"
                  >
                    อนุมัติให้ยืม
                  </button>
                )}

                {r.status === 'approved' && (
                  <button
                    onClick={() => handleEquipmentStatusChange(r.id, 'borrowed')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-200 bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-500/40 cursor-pointer"
                  >
                    ส่งมอบของแล้ว (Borrowed)
                  </button>
                )}

                {r.status === 'borrowed' && (
                  <button
                    onClick={() => handleEquipmentStatusChange(r.id, 'returned')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-200 bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 cursor-pointer"
                  >
                    รับคืนเรียบร้อย (Returned)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Add Items */}
      {activeTab === 'add-item' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Room */}
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>เพิ่มห้องปฏิบัติการใหม่</span>
            </h3>
            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ชื่อห้อง</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="เช่น Cloud Computing & DevOps Sandbox"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">รหัสห้อง</label>
                  <input
                    type="text"
                    required
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value)}
                    placeholder="LAB-501"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">ชั้น</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    required
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(parseInt(e.target.value) || 1)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">ความจุ (คน)</label>
                  <input
                    type="number"
                    min={5}
                    required
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(parseInt(e.target.value) || 20)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">คำอธิบาย</label>
                <textarea
                  rows={2}
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="รายละเอียดอุปกรณ์และสเปกคอมพิวเตอร์"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs resize-none"
                />
              </div>

              {/* Room Image Section */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>รูปภาพห้องปฏิบัติการ (Room Photo)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">อัปโหลดจากเครื่อง หรือเลือกภาพตัวอย่าง</span>
                </div>

                {/* Preview Thumbnail */}
                {newRoomImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-cyan-500/40 h-32 group bg-slate-950">
                    <img
                      src={newRoomImage}
                      alt="Room Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewRoomImage('')}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/90 hover:bg-rose-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบรูปภาพ</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-950/70 group">
                    <Upload className="w-5 h-5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-slate-200 font-medium">คลิกเพื่ออัปโหลดรูปภาพจากอุปกรณ์</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">รองรับ JPG, PNG, WebP (ย่อขนาดอัตโนมัติ)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, setNewRoomImage)}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Preset Chips */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-1">หรือเลือกจากคลังภาพตัวอย่างตึกไอที:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ROOM_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setNewRoomImage(preset.url)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          newRoomImage === preset.url
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-semibold shadow-sm'
                            : 'bg-slate-900/60 text-slate-400 hover:text-white border-white/5'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Or Custom URL */}
                <input
                  type="url"
                  value={newRoomImage}
                  onChange={(e) => setNewRoomImage(e.target.value)}
                  placeholder="หรือวาง URL รูปภาพ (https://...)"
                  className="w-full glass-input px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 cursor-pointer shadow-md"
              >
                บันทึกห้องใหม่ลงระบบ
              </button>
            </form>
          </div>

          {/* Add Equipment */}
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>เพิ่มอุปกรณ์ส่วนกลางใหม่</span>
            </h3>
            <form onSubmit={handleCreateEquipment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ชื่ออุปกรณ์</label>
                <input
                  type="text"
                  required
                  value={newEqName}
                  onChange={(e) => setNewEqName(e.target.value)}
                  placeholder="เช่น Raspberry Pi 5 8GB Starter Kit"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">หมวดหมู่</label>
                  <select
                    value={newEqCategory}
                    onChange={(e) => setNewEqCategory(e.target.value as any)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs bg-slate-900"
                  >
                    <option value="computing">Computing</option>
                    <option value="network">Network</option>
                    <option value="vr_ar">VR / AR</option>
                    <option value="media">Media & Camera</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">จำนวนรวม</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newEqQty}
                    onChange={(e) => setNewEqQty(parseInt(e.target.value) || 1)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Serial Number</label>
                <input
                  type="text"
                  required
                  value={newEqSerial}
                  onChange={(e) => setNewEqSerial(e.target.value)}
                  placeholder="RPI5-2026-IT-001"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">คุณสมบัติเฉพาะ</label>
                <input
                  type="text"
                  value={newEqSpecs}
                  onChange={(e) => setNewEqSpecs(e.target.value)}
                  placeholder="Quad-core ARM, 8GB RAM, Case with Active Cooler"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                />
              </div>

              {/* Equipment Image Section */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>รูปภาพครุภัณฑ์/อุปกรณ์ (Equipment Photo)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">อัปโหลดจากเครื่อง หรือเลือกภาพตัวอย่าง</span>
                </div>

                {/* Preview Thumbnail */}
                {newEqImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-indigo-500/40 h-32 group bg-slate-950">
                    <img
                      src={newEqImage}
                      alt="Equipment Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewEqImage('')}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/90 hover:bg-rose-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบรูปภาพ</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/15 hover:border-indigo-400/50 rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-950/70 group">
                    <Upload className="w-5 h-5 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-slate-200 font-medium">คลิกเพื่ออัปโหลดรูปภาพจากอุปกรณ์</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">รองรับ JPG, PNG, WebP (ย่อขนาดอัตโนมัติ)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, setNewEqImage)}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Preset Chips */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-1">หรือเลือกจากคลังภาพตัวอย่างอุปกรณ์:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {EQUIPMENT_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setNewEqImage(preset.url)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          newEqImage === preset.url
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50 font-semibold shadow-sm'
                            : 'bg-slate-900/60 text-slate-400 hover:text-white border-white/5'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Or Custom URL */}
                <input
                  type="url"
                  value={newEqImage}
                  onChange={(e) => setNewEqImage(e.target.value)}
                  placeholder="หรือวาง URL รูปภาพ (https://...)"
                  className="w-full glass-input px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 cursor-pointer shadow-md"
              >
                บันทึกอุปกรณ์ใหม่ลงสต็อก
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Trail */}
      {activeTab === 'audit' && (
        <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>บันทึกความปลอดภัยและการเข้าถึง (Security Audit Trail)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              จำนวน {auditLogs.length} รายการ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono">
                  <th className="pb-2">เวลา (Timestamp)</th>
                  <th className="pb-2">ระดับความรุนแรง</th>
                  <th className="pb-2">เหตุการณ์</th>
                  <th className="pb-2">ผู้ใช้ / IP</th>
                  <th className="pb-2">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="py-2.5 text-slate-400 tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          log.severity === 'critical'
                            ? 'text-rose-300 bg-rose-950/80 border border-rose-800'
                            : log.severity === 'warning'
                            ? 'text-amber-300 bg-amber-950/80 border border-amber-800'
                            : 'text-cyan-300 bg-cyan-950/80 border border-cyan-800'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2.5 text-white font-sans">{log.action}</td>
                    <td className="py-2.5 text-slate-400">
                      {log.userEmail || 'Anonymous'} · {log.ipAddress}
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {log.eventType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
