import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { SatisfactionFeedback, FeedbackSummaryStats, Room, Equipment } from '../types/index.ts';
import { clientStorage } from '../services/clientStorage.ts';
import {
  Star,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Laptop,
  MessageSquare,
  ThumbsUp,
  User,
  ShieldCheck,
  Filter,
  Plus,
  X,
  Send,
  HelpCircle,
  Clock,
  Search,
  Flame,
  Award
} from 'lucide-react';

interface SatisfactionSectionProps {
  openAuthModal: () => void;
  preselectedTarget?: {
    type: 'room' | 'equipment' | 'overall';
    id?: string;
    name: string;
  };
}

export const SatisfactionSection: React.FC<SatisfactionSectionProps> = ({
  openAuthModal,
  preselectedTarget,
}) => {
  const { user, token } = useAuth();
  const [feedbacks, setFeedbacks] = useState<SatisfactionFeedback[]>([]);
  const [stats, setStats] = useState<FeedbackSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'room' | 'equipment' | 'overall' | 'issues'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [helpfulVotes, setHelpfulVotes] = useState<{ [id: string]: number }>({});

  // Rooms and Equipment list for modal selector
  const [roomsList, setRoomsList] = useState<Room[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [formTargetType, setFormTargetType] = useState<'room' | 'equipment' | 'overall'>('overall');
  const [formTargetId, setFormTargetId] = useState<string>('');
  const [formTargetName, setFormTargetName] = useState<string>('ภาพรวมการบริการอาคารเทคโนโลยีสารสนเทศ');
  const [formRating, setFormRating] = useState<number>(5);
  const [formCleanliness, setFormCleanliness] = useState<number>(5);
  const [formSpeed, setFormSpeed] = useState<number>(5);
  const [formStaff, setFormStaff] = useState<number>(5);
  const [formComment, setFormComment] = useState<string>('');
  const [formIssueReport, setFormIssueReport] = useState<string>('');
  const [formHasIssue, setFormHasIssue] = useState<boolean>(false);
  const [formIsAnonymous, setFormIsAnonymous] = useState<boolean>(false);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Handle preselectedTarget
  useEffect(() => {
    if (preselectedTarget) {
      setFormTargetType(preselectedTarget.type);
      setFormTargetId(preselectedTarget.id || '');
      setFormTargetName(preselectedTarget.name);
      setIsModalOpen(true);
    }
  }, [preselectedTarget]);

  // Fetch feedback and catalogs
  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch feedback
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
        setStats(data.stats || null);
      } else {
        throw new Error('API feedback error');
      }
    } catch {
      // Fallback
      const localFbs = clientStorage.getFeedbacks();
      const localStats = clientStorage.getFeedbackStats();
      setFeedbacks(localFbs);
      setStats(localStats);
    }

    try {
      // Fetch catalog for choices
      const [roomsRes, eqRes] = await Promise.all([
        fetch('/api/catalog/rooms'),
        fetch('/api/catalog/equipment'),
      ]);
      if (roomsRes.ok) {
        const rData = await roomsRes.json();
        setRoomsList(rData.rooms || []);
      } else {
        setRoomsList(clientStorage.getRooms());
      }
      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipmentList(eqData.equipment || []);
      } else {
        setEquipmentList(clientStorage.getEquipment());
      }
    } catch {
      setRoomsList(clientStorage.getRooms());
      setEquipmentList(clientStorage.getEquipment());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setModalSuccessMsg(null);
    setModalErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleTargetTypeChange = (type: 'room' | 'equipment' | 'overall') => {
    setFormTargetType(type);
    if (type === 'overall') {
      setFormTargetId('');
      setFormTargetName('ภาพรวมการบริการอาคารเทคโนโลยีสารสนเทศ');
    } else if (type === 'room') {
      const first = roomsList[0];
      setFormTargetId(first ? first.id : 'room-cybersec');
      setFormTargetName(first ? first.name : 'ห้องปฏิบัติการ Cybersecurity (LAB-CYBER)');
    } else {
      const first = equipmentList[0];
      setFormTargetId(first ? first.id : 'eq-gpu-01');
      setFormTargetName(first ? first.name : 'การ์ดจอประมวลผลสูง (NVIDIA RTX)');
    }
  };

  const handleRoomSelect = (roomId: string) => {
    setFormTargetId(roomId);
    const room = roomsList.find((r) => r.id === roomId);
    if (room) setFormTargetName(room.name);
  };

  const handleEquipmentSelect = (eqId: string) => {
    setFormTargetId(eqId);
    const eq = equipmentList.find((e) => e.id === eqId);
    if (eq) setFormTargetName(eq.name);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTargetName.trim()) {
      setModalErrorMsg('กรุณาระบุหัวข้อที่ต้องการประเมิน');
      return;
    }

    setSubmitting(true);
    setModalErrorMsg(null);

    const payload = {
      targetType: formTargetType,
      targetId: formTargetId || undefined,
      targetName: formTargetName,
      rating: formRating,
      cleanlinessRating: formCleanliness,
      speedRating: formSpeed,
      staffRating: formStaff,
      comment: formComment,
      issueReport: formHasIssue ? formIssueReport : '',
      isAnonymous: formIsAnonymous,
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setModalSuccessMsg('บันทึกแบบประเมินความพึงพอใจสำเร็จ! ขอบพระคุณสำหรับข้อคิดเห็น');
        setTimeout(() => {
          setIsModalOpen(false);
          loadData();
          // Reset form
          setFormComment('');
          setFormIssueReport('');
          setFormHasIssue(false);
          setModalSuccessMsg(null);
        }, 1200);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'บันทึกไม่สำเร็จ');
      }
    } catch {
      // Local fallback
      const newFb: SatisfactionFeedback = {
        id: `fb-${Date.now()}`,
        targetType: formTargetType,
        targetId: formTargetId || undefined,
        targetName: formTargetName,
        userId: user ? user.id : 'local-user',
        userName: formIsAnonymous ? 'ผู้ใช้งาน (ไม่ระบุตัวตน)' : (user?.name || 'ผู้ใช้บริการ'),
        userEmail: formIsAnonymous ? 'anonymous@it.ac.th' : (user?.email || 'user@example.com'),
        userRole: user?.role || 'user',
        rating: formRating,
        cleanlinessRating: formCleanliness,
        speedRating: formSpeed,
        staffRating: formStaff,
        comment: formComment,
        issueReport: formHasIssue ? formIssueReport : '',
        isAnonymous: formIsAnonymous,
        createdAt: new Date().toISOString(),
      };
      clientStorage.addFeedback(newFb);
      setModalSuccessMsg('บันทึกแบบประเมินความพึงพอใจสำเร็จ (Local Secured)!');
      setTimeout(() => {
        setIsModalOpen(false);
        loadData();
        setFormComment('');
        setFormIssueReport('');
        setFormHasIssue(false);
        setModalSuccessMsg(null);
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteHelpful = (id: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5:
        return '🌟 ดีเยี่ยม ประทับใจมากที่สุด';
      case 4:
        return '😊 ดีมาก ตรงตามความคาดหวัง';
      case 3:
        return '🙂 ปานกลาง ได้มาตรฐานทั่วไป';
      case 2:
        return '😐 พอใช้ ควรได้รับการปรับปรุง';
      case 1:
        return '😞 แย่ ต้องปรับปรุงเร่งด่วน';
      default:
        return '';
    }
  };

  // Filtered feedbacks
  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (filterType === 'room' && fb.targetType !== 'room') return false;
    if (filterType === 'equipment' && fb.targetType !== 'equipment') return false;
    if (filterType === 'overall' && fb.targetType !== 'overall') return false;
    if (filterType === 'issues' && (!fb.issueReport || fb.issueReport.trim().length === 0)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = fb.targetName.toLowerCase().includes(q);
      const matchComment = fb.comment.toLowerCase().includes(q);
      const matchIssue = (fb.issueReport || '').toLowerCase().includes(q);
      return matchName || matchComment || matchIssue;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <HeartHandshake className="w-4 h-4 text-cyan-400" />
            <span>ระบบประเมินความพึงพอใจและคุณภาพบริการ (CSAT & Quality Feedback)</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>ศูนย์ประเมินความพึงพอใจการใช้งานอาคารไอที</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              Verified
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            ร่วมส่งต่อข้อเสนอแนะ ให้คะแนนห้องปฏิบัติการ อุปกรณ์ส่วนกลาง หรือแจ้งปัญหาการใช้งานจริง เพื่อพัฒนามาตรฐานการให้บริการของคณะเทคโนโลยีสารสนเทศอย่างต่อเนื่อง
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
        >
          <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
          <span>เขียนแบบประเมินความพึงพอใจ</span>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Stats Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Overall Rating */}
          <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">คะแนนความพึงพอใจรวม</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">{stats.averageRating}</span>
              <span className="text-xs text-slate-400 font-mono">/ 5.0 ดาว</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= Math.round(stats.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-600'
                  }`}
                />
              ))}
              <span className="text-[11px] text-slate-400 ml-1.5 font-mono">
                ({stats.totalReviews} ความคิดเห็น)
              </span>
            </div>
          </div>

          {/* Card 2: Recommendation Rate */}
          <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">อัตราความประทับใจ (CSAT)</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <ThumbsUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-300 tracking-tight">
                {stats.recommendationRate}%
              </span>
              <span className="text-xs text-slate-400">พึงพอใจระดับดีขึ้นไป</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all"
                style={{ width: `${stats.recommendationRate}%` }}
              />
            </div>
          </div>

          {/* Card 3: Cleanliness & Readiness */}
          <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">ความสะอาด & ความพร้อม</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-cyan-300 tracking-tight">{stats.cleanlinessAvg}</span>
              <span className="text-xs text-slate-400 font-mono">/ 5.0</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              ความสมบูรณ์ของห้องแล็บและสภาพอุปกรณ์
            </p>
          </div>

          {/* Card 4: Service Speed & Staff */}
          <div className="glass-panel rounded-2xl p-5 border border-indigo-500/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">ความรวดเร็ว & เจ้าหน้าที่</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-300 tracking-tight">{stats.staffAvg}</span>
              <span className="text-xs text-slate-400 font-mono">/ 5.0</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              การประสานงานและคำแนะนำของเจ้าหน้าที่
            </p>
          </div>
        </div>
      )}

      {/* Main Content Layout: Filters + Reviews Grid */}
      <div className="space-y-4">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              ทั้งหมด ({feedbacks.length})
            </button>
            <button
              onClick={() => setFilterType('room')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === 'room'
                  ? 'bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-400/20'
                  : 'bg-slate-900/80 text-cyan-300 hover:text-white border border-cyan-800/40'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>ห้องปฏิบัติการ ({feedbacks.filter((f) => f.targetType === 'room').length})</span>
            </button>
            <button
              onClick={() => setFilterType('equipment')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === 'equipment'
                  ? 'bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-400/20'
                  : 'bg-slate-900/80 text-emerald-300 hover:text-white border border-emerald-800/40'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>อุปกรณ์ส่วนกลาง ({feedbacks.filter((f) => f.targetType === 'equipment').length})</span>
            </button>
            <button
              onClick={() => setFilterType('overall')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === 'overall'
                  ? 'bg-indigo-400 text-slate-950 font-bold shadow-lg shadow-indigo-400/20'
                  : 'bg-slate-900/80 text-indigo-300 hover:text-white border border-indigo-800/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ภาพรวมอาคาร ({feedbacks.filter((f) => f.targetType === 'overall').length})</span>
            </button>
            <button
              onClick={() => setFilterType('issues')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === 'issues'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20'
                  : 'bg-slate-900/80 text-amber-300 hover:text-white border border-amber-800/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>แจ้งปัญหาการใช้งาน ({feedbacks.filter((f) => f.issueReport && f.issueReport.trim().length > 0).length})</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามชื่อห้อง, อุปกรณ์ หรือข้อความ..."
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Reviews Feed */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-2xl glass-card animate-pulse" />
            ))}
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 max-w-lg mx-auto my-8">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">ยังไม่พบแบบประเมินในหมวดนี้</h4>
            <p className="text-xs text-slate-400 mb-6">
              ร่วมเป็นคนแรกที่ส่งแบบประเมินความพึงพอใจสำหรับหมวดหมู่นี้
            </p>
            <button
              onClick={handleOpenModal}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              เขียนแบบประเมินความพึงพอใจ
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeedbacks.map((fb) => {
              const isRoom = fb.targetType === 'room';
              const isEq = fb.targetType === 'equipment';
              const votes = helpfulVotes[fb.id] || 0;

              return (
                <div
                  key={fb.id}
                  className="glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Target & Rating */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                              isRoom
                                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60'
                                : isEq
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                                : 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60'
                            }`}
                          >
                            {isRoom ? 'ห้องปฏิบัติการ' : isEq ? 'อุปกรณ์ส่วนกลาง' : 'ภาพรวมบริการ'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(fb.createdAt).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{fb.targetName}</h4>
                      </div>

                      {/* Stars badge */}
                      <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-amber-500/30 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold font-mono text-amber-300">{fb.rating}.0</span>
                      </div>
                    </div>

                    {/* Detailed dimension chips */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-300">
                      <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-white/5">
                        ความสะอาด: <strong className="text-cyan-300">{fb.cleanlinessRating}/5</strong>
                      </span>
                      <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-white/5">
                        ความรวดเร็ว: <strong className="text-emerald-300">{fb.speedRating}/5</strong>
                      </span>
                      <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-white/5">
                        คำแนะนำเจ้าหน้าที่: <strong className="text-indigo-300">{fb.staffRating}/5</strong>
                      </span>
                    </div>

                    {/* Comment Text */}
                    {fb.comment && (
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        "{fb.comment}"
                      </p>
                    )}

                    {/* Reported Issue (if any) */}
                    {fb.issueReport && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>ข้อเสนอแนะ/ปัญหาที่แจ้ง:</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{fb.issueReport}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer Row: User & Helpful Vote */}
                  <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-300">{fb.userName}</span>
                      {fb.userRole === 'admin' && (
                        <span className="text-[9px] font-mono text-amber-300 bg-amber-500/20 px-1 rounded">
                          Staff
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleVoteHelpful(fb.id)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="กดถูกใจหรือเห็นว่ารีวิวนี้มีประโยชน์"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>มีประโยชน์ {votes > 0 && `(${votes})`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evaluation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl text-slate-100 my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Star className="w-5 h-5 fill-white text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">แบบประเมินความพึงพอใจและคุณภาพบริการ</h3>
                <p className="text-xs text-slate-400">
                  คณะเทคโนโลยีสารสนเทศ อาคาร IT Building
                </p>
              </div>
            </div>

            {modalSuccessMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{modalSuccessMsg}</span>
              </div>
            )}

            {modalErrorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="space-y-5">
              {/* Step 1: Target Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  1. เลือกสิ่งที่ต้องการประเมิน
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('overall')}
                    className={`p-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all ${
                      formTargetType === 'overall'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>ภาพรวมอาคาร</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('room')}
                    className={`p-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all ${
                      formTargetType === 'room'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    <span>ห้องปฏิบัติการ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('equipment')}
                    className={`p-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all ${
                      formTargetType === 'equipment'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Laptop className="w-4 h-4 text-cyan-400" />
                    <span>อุปกรณ์ส่วนกลาง</span>
                  </button>
                </div>

                {/* Sub dropdown when Room or Equipment selected */}
                {formTargetType === 'room' && (
                  <select
                    value={formTargetId}
                    onChange={(e) => handleRoomSelect(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {roomsList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name} (ชั้น {r.floor})
                      </option>
                    ))}
                  </select>
                )}

                {formTargetType === 'equipment' && (
                  <select
                    value={formTargetId}
                    onChange={(e) => handleEquipmentSelect(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {equipmentList.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.serialNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Step 2: Main 5-Star Rating */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 text-center space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  2. ระดับความพึงพอใจโดยรวม (Overall Satisfaction)
                </label>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFormRating(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= (hoverRating || formRating)
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold text-amber-300">
                  {getRatingLabel(hoverRating || formRating)}
                </p>
              </div>

              {/* Step 3: Dimension Breakdown (3 Categories) */}
              <div className="space-y-3 bg-slate-900/40 p-3.5 rounded-2xl border border-white/5">
                <span className="text-xs font-semibold text-slate-300 block">
                  3. ให้คะแนนรายด้าน (1 - 5 ดาว)
                </span>

                {/* Cleanliness */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">สภาพความสะอาด & ความสมบูรณ์:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormCleanliness(s)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= formCleanliness ? 'fill-cyan-400 text-cyan-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-[11px] font-mono text-cyan-300 ml-1.5 w-6 text-right">
                      {formCleanliness}★
                    </span>
                  </div>
                </div>

                {/* Speed */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">ความสะดวกรวดเร็วในการบริการ:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormSpeed(s)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= formSpeed ? 'fill-emerald-400 text-emerald-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-[11px] font-mono text-emerald-300 ml-1.5 w-6 text-right">
                      {formSpeed}★
                    </span>
                  </div>
                </div>

                {/* Staff */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">การดูแลและคำแนะนำของเจ้าหน้าที่:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormStaff(s)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= formStaff ? 'fill-indigo-400 text-indigo-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-[11px] font-mono text-indigo-300 ml-1.5 w-6 text-right">
                      {formStaff}★
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4: Comments */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  4. ข้อคิดเห็นหรือความประทับใจเพิ่มเติม
                </label>
                <textarea
                  rows={3}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="บอกเล่าประสบการณ์ ความประทับใจ หรือสิ่งที่อยากชมเชยทีมงาน..."
                  className="w-full bg-slate-900 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Step 5: Issue Reporting Checkbox & Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formHasIssue}
                    onChange={(e) => setFormHasIssue(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 text-cyan-500 focus:ring-0 bg-slate-900"
                  />
                  <span>พบข้อบกพร่อง / อุปกรณ์ชำรุด หรือจุดที่ต้องการให้แก้ไขหรือไม่?</span>
                </label>

                {formHasIssue && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={formIssueReport}
                      onChange={(e) => setFormIssueReport(e.target.value)}
                      placeholder="ระบุปัญหา เช่น แอร์ในห้องไม่เย็น, หัวสายแลนล็อคหลวม, ไฟดับบางจุด..."
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-xl p-2.5 text-xs text-amber-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[10px] text-amber-300/80 mt-1">
                      * ข้อมูลปัญหานี้จะถูกส่งต่อให้ทีมเทคนิคประจำอาคารไอทีดำเนินการตรวจสอบทันที
                    </p>
                  </div>
                )}
              </div>

              {/* Step 6: Anonymous Toggle */}
              <div className="pt-1 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>ส่งแบบประเมินแบบไม่เปิดเผยตัวตน (Anonymous)</span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsAnonymous}
                  onChange={(e) => setFormIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-cyan-500 focus:ring-0 bg-slate-900 cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'กำลังบันทึก...' : 'ส่งแบบประเมิน'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
