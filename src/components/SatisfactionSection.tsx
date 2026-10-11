import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { SatisfactionFeedback, FeedbackSummaryStats, Room, Equipment } from '../types/index.ts';
import { clientStorage } from '../services/clientStorage.ts';
import {
  Star,
  MessageSquareHeart,
  ThumbsUp,
  Sparkles,
  ShieldCheck,
  Building2,
  Laptop,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  EyeOff,
  Filter,
  Search,
  Plus,
  X,
  TrendingUp,
  Award,
  Sparkle,
  Clock,
  Heart
} from 'lucide-react';

interface SatisfactionSectionProps {
  openAuthModal: () => void;
  preselectedTarget?: { type: 'room' | 'equipment' | 'overall'; id?: string; name: string };
}

export const SatisfactionSection: React.FC<SatisfactionSectionProps> = ({
  openAuthModal,
  preselectedTarget,
}) => {
  const { user, token } = useAuth();

  const [feedbacks, setFeedbacks] = useState<SatisfactionFeedback[]>([]);
  const [stats, setStats] = useState<FeedbackSummaryStats>({
    averageRating: 5.0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    cleanlinessAvg: 5.0,
    speedAvg: 5.0,
    staffAvg: 5.0,
    recommendationRate: 100,
  });
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

  // Filter and search
  const [filterType, setFilterType] = useState<'all' | 'room' | 'equipment' | 'overall' | 'issues'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Helpful vote loading state
  const [votingFeedbackId, setVotingFeedbackId] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'room' | 'equipment' | 'overall'>('overall');
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState('ภาพรวมการบริการอาคารเทคโนโลยีสารสนเทศ');
  const [rating, setRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [speedRating, setSpeedRating] = useState(5);
  const [staffRating, setStaffRating] = useState(5);
  const [comment, setComment] = useState('');
  const [issueReport, setIssueReport] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState('');
  const [modalErrorMsg, setModalErrorMsg] = useState('');

  // Load feedbacks and catalog
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch feedbacks
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
        if (data.stats) setStats(data.stats);
      } else {
        const localFbs = clientStorage.getFeedbacks();
        setFeedbacks(localFbs);
        setStats(clientStorage.getFeedbackStats());
      }
    } catch {
      const localFbs = clientStorage.getFeedbacks();
      setFeedbacks(localFbs);
      setStats(clientStorage.getFeedbackStats());
    }

    try {
      // 2. Fetch rooms & equipment catalogs
      const [roomsRes, eqRes] = await fetch('/api/catalog/rooms').then((r) => r.json()).catch(() => ({ rooms: [] }));
      const [eqData] = await Promise.all([
        fetch('/api/catalog/equipment').then((r) => r.json()).catch(() => ({ equipment: [] }))
      ]);
      if (roomsRes?.rooms) {
        setRooms(roomsRes.rooms);
      } else {
        setRooms(clientStorage.getRooms());
      }
      if (eqData?.equipment) {
        setEquipmentList(eqData.equipment);
      } else {
        setEquipmentList(clientStorage.getEquipment());
      }
    } catch {
      setRooms(clientStorage.getRooms());
      setEquipmentList(clientStorage.getEquipment());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When preselectedTarget changes, auto open form
  useEffect(() => {
    if (preselectedTarget) {
      setTargetType(preselectedTarget.type);
      setTargetId(preselectedTarget.id || '');
      setTargetName(preselectedTarget.name);
      setIsModalOpen(true);
    }
  }, [preselectedTarget]);

  const handleOpenNewModal = () => {
    setTargetType('overall');
    setTargetId('');
    setTargetName('ภาพรวมการบริการอาคารเทคโนโลยีสารสนเทศ');
    setRating(5);
    setCleanlinessRating(5);
    setSpeedRating(5);
    setStaffRating(5);
    setComment('');
    setIssueReport('');
    setIsAnonymous(false);
    setModalSuccessMsg('');
    setModalErrorMsg('');
    setIsModalOpen(true);
  };

  const handleTargetTypeChange = (type: 'room' | 'equipment' | 'overall') => {
    setTargetType(type);
    if (type === 'overall') {
      setTargetId('');
      setTargetName('ภาพรวมการบริการอาคารเทคโนโลยีสารสนเทศ');
    } else if (type === 'room') {
      if (rooms.length > 0) {
        setTargetId(rooms[0].id);
        setTargetName(rooms[0].name);
      } else {
        setTargetId('');
        setTargetName('ห้องปฏิบัติการไอที');
      }
    } else if (type === 'equipment') {
      if (equipmentList.length > 0) {
        setTargetId(equipmentList[0].id);
        setTargetName(equipmentList[0].name);
      } else {
        setTargetId('');
        setTargetName('อุปกรณ์ส่วนกลาง');
      }
    }
  };

  const handleSpecificTargetChange = (id: string) => {
    setTargetId(id);
    if (targetType === 'room') {
      const rm = rooms.find((r) => r.id === id);
      if (rm) setTargetName(rm.name);
    } else if (targetType === 'equipment') {
      const eq = equipmentList.find((e) => e.id === id);
      if (eq) setTargetName(eq.name);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setModalErrorMsg('กรุณากรอกความคิดเห็นหรือข้อเสนอแนะ');
      return;
    }

    setSubmitting(true);
    setModalErrorMsg('');
    setModalSuccessMsg('');

    const payload = {
      targetType,
      targetId: targetId || undefined,
      targetName: targetName.trim(),
      rating,
      cleanlinessRating,
      speedRating,
      staffRating,
      comment: comment.trim(),
      issueReport: issueReport.trim(),
      isAnonymous,
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
        }, 1200);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'ไม่สามารถส่งแบบประเมินได้');
      }
    } catch (err: any) {
      // Local fallback
      const newFb: SatisfactionFeedback = {
        id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        targetType,
        targetId: targetId || undefined,
        targetName,
        userId: user?.id || 'anon-local',
        userName: isAnonymous ? 'ผู้ใช้งาน (ไม่ระบุตัวตน)' : (user?.name || 'ผู้ใช้บริการตึกไอที'),
        userEmail: isAnonymous ? 'anonymous@it.ac.th' : (user?.email || 'anonymous@it.ac.th'),
        userRole: user?.role || 'user',
        rating,
        cleanlinessRating,
        speedRating,
        staffRating,
        comment: comment.trim(),
        issueReport: issueReport.trim(),
        isAnonymous,
        helpfulUserIds: [],
        createdAt: new Date().toISOString(),
      };
      clientStorage.addFeedback(newFb);
      setModalSuccessMsg('บันทึกแบบประเมินความพึงพอใจสำเร็จ!');
      setTimeout(() => {
        setIsModalOpen(false);
        loadData();
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteHelpful = async (id: string) => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (votingFeedbackId) return;
    setVotingFeedbackId(id);

    try {
      const res = await fetch(`/api/feedback/${id}/helpful`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setFeedbacks((prev) =>
          prev.map((fb) => (fb.id === id ? data.feedback : fb))
        );
      } else {
        const result = clientStorage.toggleHelpful(id, user.id);
        if (result) {
          setFeedbacks((prev) =>
            prev.map((fb) => (fb.id === id ? result.feedback : fb))
          );
        }
      }
    } catch {
      const result = clientStorage.toggleHelpful(id, user.id);
      if (result) {
        setFeedbacks((prev) =>
          prev.map((fb) => (fb.id === id ? result.feedback : fb))
        );
      }
    } finally {
      setVotingFeedbackId(null);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5:
        return 'ดีเยี่ยม (5/5)';
      case 4:
        return 'ดีมาก (4/5)';
      case 3:
        return 'ปานกลาง (3/5)';
      case 2:
        return 'ควรปรับปรุง (2/5)';
      case 1:
        return 'ต้องปรับปรุงด่วน (1/5)';
      default:
        return `${r}/5`;
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
      const matchUser = fb.userName.toLowerCase().includes(q);
      const matchIssue = (fb.issueReport || '').toLowerCase().includes(q);
      if (!matchName && !matchComment && !matchUser && !matchIssue) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-xs font-semibold">
              <MessageSquareHeart className="w-3.5 h-3.5" />
              <span>ระบบประเมินความพึงพอใจและคุณภาพบริการ (CSAT & Quality Feedback)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ศูนย์ประเมินความพึงพอใจการใช้งานอาคารไอที
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              ร่วมแสดงความคิดเห็น ให้คะแนนห้องปฏิบัติการ อุปกรณ์ส่วนกลาง หรือบริการภาพรวม เพื่อช่วยพัฒนาและยกระดับมาตรฐานความปลอดภัยและคุณภาพของอาคารไอที
            </p>
          </div>

          <button
            onClick={handleOpenNewModal}
            className="px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เขียนแบบประเมินความพึงพอใจ</span>
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">คะแนนความพึงพอใจรวม</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : '-'}
              </span>
              <span className="text-xs text-slate-400">/ 5.0</span>
            </div>
            <div className="flex gap-0.5 mt-2">
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
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">จำนวนแบบประเมิน</span>
              <MessageSquareHeart className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats.totalReviews}
              </span>
              <span className="text-xs text-slate-400">รายการ</span>
            </div>
            <span className="text-[11px] text-cyan-300/80 mt-2 block font-mono">
              {stats.totalReviews > 0 ? 'จากผู้ใช้บริการจริง' : 'รอแบบประเมินแรก'}
            </span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">พึงพอใจระดับดีขึ้นไป</span>
              <ThumbsUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {stats.totalReviews > 0 ? `${stats.recommendationRate}%` : '-'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 block">
              {stats.totalReviews > 0 ? 'ให้คะแนน 4-5 ดาว' : 'คำนวณอัตโนมัติ'}
            </span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">เฉลี่ย 3 มิติบริการ</span>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xs text-slate-300 space-y-1 mt-1">
              <div className="flex justify-between">
                <span>ความสะอาด:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {stats.totalReviews > 0 ? stats.cleanlinessAvg.toFixed(1) : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ความรวดเร็ว:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {stats.totalReviews > 0 ? stats.speedAvg.toFixed(1) : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>เจ้าหน้าที่:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {stats.totalReviews > 0 ? stats.staffAvg.toFixed(1) : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'glass-card text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            ทั้งหมด ({feedbacks.length})
          </button>
          <button
            onClick={() => setFilterType('room')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'room'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'glass-card text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>ห้องปฏิบัติการ ({feedbacks.filter((f) => f.targetType === 'room').length})</span>
          </button>
          <button
            onClick={() => setFilterType('equipment')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'equipment'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'glass-card text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>อุปกรณ์ส่วนกลาง ({feedbacks.filter((f) => f.targetType === 'equipment').length})</span>
          </button>
          <button
            onClick={() => setFilterType('overall')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'overall'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'glass-card text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ภาพรวมอาคาร ({feedbacks.filter((f) => f.targetType === 'overall').length})</span>
          </button>
          <button
            onClick={() => setFilterType('issues')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'issues'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'glass-card text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>แจ้งปัญหาการใช้งาน ({feedbacks.filter((f) => f.issueReport && f.issueReport.trim().length > 0).length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาข้อเสนอแนะ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      {/* Feedbacks Grid / List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-3" />
          <p className="text-xs text-slate-400">กำลังโหลดรายการแบบประเมินความพึงพอใจ...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-white/10 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
            <MessageSquareHeart className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">ยังไม่มีแบบประเมินความพึงพอใจในหมวดหมู่นี้</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              ร่วมเป็นคนแรกที่ส่งแบบประเมินความพึงพอใจ เพื่อช่วยพัฒนาคุณภาพอาคารเทคโนโลยีสารสนเทศให้ดียิ่งขึ้น
            </p>
          </div>
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-cyan-200 glass-card hover:bg-cyan-500/20 border border-cyan-400/30 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เขียนแบบประเมินความพึงพอใจ</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredFeedbacks.map((fb) => {
            const helpfulList = Array.isArray(fb.helpfulUserIds) ? fb.helpfulUserIds : [];
            const votes = helpfulList.length;
            const isVotedByUser = user ? helpfulList.includes(user.id) : false;
            const isVotingThis = votingFeedbackId === fb.id;

            return (
              <div
                key={fb.id}
                className="glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-xs font-bold">
                        {fb.isAnonymous ? <EyeOff className="w-4 h-4 text-slate-400" /> : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {fb.userName}
                          </span>
                          {fb.isAnonymous && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                              ไม่เปิดเผยตัวตน
                            </span>
                          )}
                          {!fb.isAnonymous && fb.userRole === 'admin' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(fb.createdAt).toLocaleString('th-TH')}</span>
                        </span>
                      </div>
                    </div>

                    {/* Target Badge */}
                    <div className="px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 shrink-0 bg-slate-900/60 border-white/10 text-slate-300">
                      {fb.targetType === 'room' && <Building2 className="w-3 h-3 text-cyan-400" />}
                      {fb.targetType === 'equipment' && <Laptop className="w-3 h-3 text-cyan-400" />}
                      {fb.targetType === 'overall' && <Sparkles className="w-3 h-3 text-amber-400" />}
                      <span className="truncate max-w-[140px] sm:max-w-[180px]">{fb.targetName}</span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= fb.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-300">
                      {getRatingLabel(fb.rating)}
                    </span>
                  </div>

                  {/* Rating breakdown pills */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-white/5">
                      ความสะอาด: <b className="text-cyan-300">{fb.cleanlinessRating}/5</b>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-white/5">
                      ความรวดเร็ว: <b className="text-cyan-300">{fb.speedRating}/5</b>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-white/5">
                      เจ้าหน้าที่: <b className="text-cyan-300">{fb.staffRating}/5</b>
                    </span>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-slate-200 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                    {fb.comment}
                  </p>

                  {/* Issue Report if provided */}
                  {fb.issueReport && fb.issueReport.trim().length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-[11px] text-amber-300 block">แจ้งปัญหาการใช้งาน:</span>
                        <p className="text-[11px] leading-relaxed text-amber-100">{fb.issueReport}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer of Card: Helpful Button (1 user = 1 vote strictly) */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    ยืนยันตัวตนด้วยระบบ RBAC
                  </span>

                  <button
                    type="button"
                    onClick={() => handleVoteHelpful(fb.id)}
                    disabled={isVotingThis}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      isVotedByUser
                        ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm shadow-cyan-500/20 font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                    title={
                      isVotedByUser
                        ? 'คุณกดเป็นประโยชน์แล้ว (คลิกเพื่อยกเลิก)'
                        : 'คลิกเพื่อให้คะแนนเป็นประโยชน์ (1 คน 1 สิทธิ์)'
                    }
                  >
                    <ThumbsUp
                      className={`w-3.5 h-3.5 ${
                        isVotedByUser ? 'fill-cyan-400 text-cyan-400' : 'text-slate-400'
                      }`}
                    />
                    <span>มีประโยชน์</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isVotedByUser
                          ? 'bg-cyan-400 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {votes}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Write Feedback Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">แบบประเมินความพึงพอใจและคุณภาพบริการ</h3>
                  <p className="text-[11px] text-slate-400">อาคารเทคโนโลยีสารสนเทศ (IT Building)</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{modalSuccessMsg}</span>
              </div>
            )}

            {modalErrorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="space-y-5">
              {/* Target Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  1. เลือกหมวดหมู่ที่ต้องการประเมิน
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('overall')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'overall'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold'
                        : 'bg-slate-900/40 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ภาพรวมอาคาร</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('room')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'room'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold'
                        : 'bg-slate-900/40 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>ห้องปฏิบัติการ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('equipment')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'equipment'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold'
                        : 'bg-slate-900/40 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>อุปกรณ์ส่วนกลาง</span>
                  </button>
                </div>
              </div>

              {/* Specific target dropdown */}
              {targetType === 'room' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">
                    เลือกห้องปฏิบัติการ:
                  </label>
                  <select
                    value={targetId}
                    onChange={(e) => handleSpecificTargetChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'equipment' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">
                    เลือกอุปกรณ์:
                  </label>
                  <select
                    value={targetId}
                    onChange={(e) => handleSpecificTargetChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {equipmentList.map((eq) => (
                      <option key={eq.id} value={eq.id} className="bg-slate-900 text-white">
                        {eq.name} ({eq.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Overall Star Rating */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white block">
                    2. ระดับความพึงพอใจโดยรวม (Overall Satisfaction)
                  </label>
                  <span className="text-xs font-bold text-amber-300">
                    {getRatingLabel(rating)}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          s <= rating
                            ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Detail Dimensions */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-900/40 border border-white/5">
                <span className="text-xs font-semibold text-slate-300 block">
                  3. ให้คะแนนรายมิติบริการ (1-5 คะแนน)
                </span>

                {/* Cleanliness */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">ความสะอาดและสภาพแวดล้อม:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCleanlinessRating(s)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= cleanlinessRating
                              ? 'fill-cyan-400 text-cyan-400'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="w-5 text-right font-mono text-cyan-300 font-bold ml-1">
                      {cleanlinessRating}
                    </span>
                  </div>
                </div>

                {/* Speed */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">ความรวดเร็วในการให้บริการ:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSpeedRating(s)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= speedRating
                              ? 'fill-cyan-400 text-cyan-400'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="w-5 text-right font-mono text-cyan-300 font-bold ml-1">
                      {speedRating}
                    </span>
                  </div>
                </div>

                {/* Staff */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">อัธยาศัยและคำแนะนำของเจ้าหน้าที่:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStaffRating(s)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= staffRating
                              ? 'fill-cyan-400 text-cyan-400'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="w-5 text-right font-mono text-cyan-300 font-bold ml-1">
                      {staffRating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  4. ความคิดเห็นหรือข้อเสนอแนะเพิ่มเติม <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="แสดงความคิดเห็น เช่น อุปกรณ์ทำงานเสถียร แอร์เย็น ห้องสะอาด หรือสิ่งที่คุณประทับใจ..."
                  className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              {/* Optional Issue Report */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>5. แจ้งปัญหาการใช้งานหรือจุดชำรุด (ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  value={issueReport}
                  onChange={(e) => setIssueReport(e.target.value)}
                  placeholder="เช่น ปลั๊กไฟโต๊ะหลังห้องไม่ติด, สายชาร์จหลวม..."
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Anonymous Checkbox */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">ส่งแบบประเมินโดยไม่ระบุตัวตน</span>
                    <span className="text-[10px] text-slate-400">ระบบจะไม่แสดงชื่อและอีเมลของคุณในหน้ารวมความเห็น</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white glass-card border border-white/10 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกแบบประเมิน'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
