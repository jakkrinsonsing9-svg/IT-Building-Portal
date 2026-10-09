import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  TrendingUp,
  PieChart,
  Calendar,
  Building2,
  Laptop,
  CheckCircle2,
  Clock,
  Activity,
  ArrowUpRight,
  Filter,
  Layers,
  Sparkles,
  BarChart3,
  RefreshCw,
  ShieldAlert,
  Lock,
  UserCheck
} from 'lucide-react';

interface WeeklyTrendPoint {
  day: string;
  dayLabel: string;
  roomBookings: number;
  equipmentRequests: number;
  totalActivity: number;
}

interface StatusDistributionItem {
  label: string;
  count: number;
  color: string;
  key: string;
}

interface RoomDistributionItem {
  name: string;
  code: string;
  bookings: number;
  percentage: number;
  color: string;
}

interface EquipmentCategoryItem {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

interface AnalyticsData {
  weeklyTrends: WeeklyTrendPoint[];
  statusDistribution: StatusDistributionItem[];
  roomDistribution: RoomDistributionItem[];
  equipmentCategoryDistribution: EquipmentCategoryItem[];
  summary: {
    totalWeeklyBookings: number;
    totalWeeklyEquipment: number;
    totalWeeklyActivities: number;
    peakDayLabel: string;
    peakDayActivity: number;
    averageDailyUsage: number;
    utilizationPercentage: number;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const { user, token, switchDemoAccount } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lineChartMetric, setLineChartMetric] = useState<'all' | 'rooms' | 'equipment'>('all');
  const [circleChartTab, setCircleChartTab] = useState<'status' | 'rooms' | 'equipment'>('status');
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [hoveredSliceKey, setHoveredSliceKey] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!token || user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/analytics/weekly', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token, user]);

  // Strict Admin Privilege Access Gate
  if (user?.role !== 'admin') {
    return (
      <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto my-12 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/15">
          <Lock className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>ADMIN PRIVILEGE REQUIRED</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          สงวนสิทธิ์การเข้าถึงเฉพาะผู้ดูแลระบบ (Admin Only)
        </h3>
        <p className="text-xs text-slate-300 mb-6 leading-relaxed max-w-md mx-auto">
          หน้าแดชบอร์ดสรุปสถิติและกราฟแสดงผลนี้จำกัดสิทธิ์เฉพาะบัญชี <span className="text-amber-300 font-mono font-bold">Admin</span> เท่านั้น ตามนโยบาย Least Privilege และข้อกำหนดของระบบ
        </p>
        <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 mb-6 text-xs text-slate-400">
          <p>
            สถานะปัจจุบันของคุณ: <span className="text-cyan-300 font-bold font-mono">{user ? user.name : 'ยังไม่ได้เข้าสู่ระบบ'}</span> ({user ? `สิทธิ์: ${user.role}` : 'Guest'})
          </p>
        </div>
        <button
          onClick={() => switchDemoAccount('admin')}
          className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-400/20 border border-amber-300 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          <span>สลับเข้าใช้งานด้วยบัญชีผู้ดูแลระบบ (Admin) ทันที</span>
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-20 rounded-2xl glass-card animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-96 rounded-3xl glass-card animate-pulse" />
          <div className="lg:col-span-4 h-96 rounded-3xl glass-card animate-pulse" />
        </div>
      </div>
    );
  }

  // Calculate SVG Coordinates for the Line Chart
  const svgWidth = 700;
  const svgHeight = 260;
  const paddingX = 45;
  const paddingY = 35;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Find max value for Y axis
  const maxVal = Math.max(
    ...data.weeklyTrends.map((d) =>
      lineChartMetric === 'all'
        ? d.totalActivity
        : lineChartMetric === 'rooms'
        ? d.roomBookings
        : d.equipmentRequests
    ),
    35
  );

  const getX = (index: number) => paddingX + (index / (data.weeklyTrends.length - 1)) * graphWidth;
  const getY = (val: number) => svgHeight - paddingY - (val / maxVal) * graphHeight;

  // Generate SVG Path using smoothing
  const buildSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    return points.reduce((acc, point, i, a) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = a[i - 1];
      const cx = (prev.x + point.x) / 2;
      return `${acc} C ${cx},${prev.y} ${cx},${point.y} ${point.x},${point.y}`;
    }, '');
  };

  const roomPoints = data.weeklyTrends.map((d, i) => ({ x: getX(i), y: getY(d.roomBookings) }));
  const eqPoints = data.weeklyTrends.map((d, i) => ({ x: getX(i), y: getY(d.equipmentRequests) }));
  const totalPoints = data.weeklyTrends.map((d, i) => ({ x: getX(i), y: getY(d.totalActivity) }));

  const roomLinePath = buildSmoothPath(roomPoints);
  const eqLinePath = buildSmoothPath(eqPoints);
  const totalLinePath = buildSmoothPath(totalPoints);

  const roomAreaPath = `${roomLinePath} L ${getX(roomPoints.length - 1)},${svgHeight - paddingY} L ${getX(0)},${svgHeight - paddingY} Z`;
  const eqAreaPath = `${eqLinePath} L ${getX(eqPoints.length - 1)},${svgHeight - paddingY} L ${getX(0)},${svgHeight - paddingY} Z`;
  const totalAreaPath = `${totalLinePath} L ${getX(totalPoints.length - 1)},${svgHeight - paddingY} L ${getX(0)},${svgHeight - paddingY} Z`;

  // Donut Chart calculations
  const donutSize = 220;
  const strokeWidth = 26;
  const radius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Prepare active donut items
  let activeDonutItems: { label: string; count: number; color: string; key: string }[] = [];
  if (circleChartTab === 'status') {
    activeDonutItems = data.statusDistribution;
  } else if (circleChartTab === 'rooms') {
    activeDonutItems = data.roomDistribution.map((r) => ({
      label: r.name,
      count: r.bookings,
      color: r.color,
      key: r.code,
    }));
  } else {
    activeDonutItems = data.equipmentCategoryDistribution.map((e) => ({
      label: e.category,
      count: e.count,
      color: e.color,
      key: e.category,
    }));
  }

  const rawDonutTotal = activeDonutItems.reduce((acc, curr) => acc + curr.count, 0);
  const donutTotal = rawDonutTotal > 0 ? rawDonutTotal : 1;

  let currentOffset = 0;
  const donutSlices = activeDonutItems.map((item) => {
    const percentage = rawDonutTotal > 0 ? item.count / donutTotal : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += percentage * circumference;
    return {
      ...item,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>ฟีเจอร์ที่ 3-4 : Dashboard สรุปสถานะการจองห้องและอุปกรณ์ (Data Visualization - Admin Only)</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Dashboard สรุปสถานะการจองห้องและขอยืมอุปกรณ์ต่อสัปดาห์
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            คำนวณจากฐานข้อมูลจริง 100% ปราศจากข้อมูลจำลอง แสดงแนวโน้มรายวัน (จันทร์-อาทิตย์) และสัดส่วนสถานะคำขอด้วยกราฟเส้นและกราฟวงกลม
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 glass-card hover:bg-white/10 flex items-center gap-2 border border-white/10 cursor-pointer self-start md:self-auto transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>อัปเดตสถิติล่าสุด</span>
        </button>
      </div>

      {/* KPI Stat Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">กิจกรรมรวมทั้งสัปดาห์</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
            {data.summary.totalWeeklyActivities}
            <span className="text-xs font-sans text-slate-400 ml-1.5 font-normal">รายการ</span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-300 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {data.summary.totalWeeklyActivities > 0
                ? 'คำนวณจากข้อมูลจริงในระบบ Real-time'
                : 'พร้อมรองรับข้อมูลการทดสอบของคุณ'}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">จองห้องปฏิบัติการ (สัปดาห์)</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-300 font-mono tabular-nums">
            {data.summary.totalWeeklyBookings}
            <span className="text-xs font-sans text-slate-400 ml-1.5 font-normal">ครั้ง</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            เฉลี่ย <span className="text-white font-mono tabular-nums">{Number((data.summary.totalWeeklyBookings / 7).toFixed(1))}</span> ครั้ง/วัน
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">ขอยืมของส่วนกลาง (สัปดาห์)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300 font-mono tabular-nums">
            {data.summary.totalWeeklyEquipment}
            <span className="text-xs font-sans text-slate-400 ml-1.5 font-normal">ชิ้น</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            เฉลี่ย <span className="text-white font-mono tabular-nums">{Number((data.summary.totalWeeklyEquipment / 7).toFixed(1))}</span> ชิ้น/วัน
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">วันที่มีการใช้งานสูงสุด</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tabular-nums">
            {data.summary.peakDayActivity > 0 ? `วัน${data.summary.peakDayLabel}` : 'ยังไม่มี'}
          </div>
          <div className="mt-2 text-[11px] text-amber-300/80">
            Peak Activity:{' '}
            <span className="font-mono font-bold">{data.summary.peakDayActivity} รายการ</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid: 1. กราฟเส้น (Line Chart) + 2. กราฟวงกลม (Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* กราฟเส้น (Line Chart) - 7 หรือ 8 Columns */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-5 sm:p-7 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>กราฟเส้นแสดงแนวโน้มการใช้งานต่อสัปดาห์ (Weekly Activity Trend)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                แกน X: วันในสัปดาห์ (จันทร์ - อาทิตย์) · แกน Y: จำนวนการส่งคำขอใช้งาน
              </p>
            </div>

            {/* Line Metric Selector */}
            <div className="flex rounded-lg bg-slate-950/70 p-1 border border-white/10 text-xs self-start sm:self-auto">
              <button
                onClick={() => setLineChartMetric('all')}
                className={`px-3 py-1 rounded-md transition-all ${
                  lineChartMetric === 'all'
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setLineChartMetric('rooms')}
                className={`px-3 py-1 rounded-md transition-all ${
                  lineChartMetric === 'rooms'
                    ? 'bg-sky-500/25 text-sky-200 border border-sky-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                จองห้อง
              </button>
              <button
                onClick={() => setLineChartMetric('equipment')}
                className={`px-3 py-1 rounded-md transition-all ${
                  lineChartMetric === 'equipment'
                    ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ยืมอุปกรณ์
              </button>
            </div>
          </div>

          {/* Legend Strip */}
          <div className="flex items-center gap-5 text-xs text-slate-300 font-mono">
            {(lineChartMetric === 'all' || lineChartMetric === 'rooms') && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                <span>จองห้องปฏิบัติการ (Room Bookings)</span>
              </div>
            )}
            {(lineChartMetric === 'all' || lineChartMetric === 'equipment') && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                <span>ขอยืมของส่วนกลาง (Equipment Loans)</span>
              </div>
            )}
            {lineChartMetric === 'all' && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 rounded-full bg-emerald-400" />
                <span>รวมทั้งหมด (Total)</span>
              </div>
            )}
          </div>

          {/* SVG Line Chart Viewport */}
          <div className="relative w-full overflow-hidden pt-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 sm:h-72 select-none overflow-visible"
            >
              <defs>
                {/* Gradients for Glowing Under-Curve Area */}
                <linearGradient id="roomGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                </linearGradient>

                {/* Filter for glowing neon line */}
                <filter id="neonGlowSky" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0, 1, 2, 3, 4].map((step) => {
                const y = paddingY + (step / 4) * graphHeight;
                const valueLabel = Math.round(maxVal - (step / 4) * maxVal);
                return (
                  <g key={step}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      fill="#94a3b8"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="JetBrains Mono"
                    >
                      {valueLabel}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Grid Columns & X Axis Labels */}
              {data.weeklyTrends.map((d, i) => {
                const x = getX(i);
                const isHovered = hoveredDayIndex === i;
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={svgHeight - paddingY}
                      stroke={isHovered ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.05)'}
                      strokeWidth={isHovered ? 2 : 1}
                    />
                    <text
                      x={x}
                      y={svgHeight - 10}
                      fill={isHovered ? '#38bdf8' : '#94a3b8'}
                      fontSize="11"
                      fontWeight={isHovered ? 'bold' : 'normal'}
                      textAnchor="middle"
                      fontFamily="Prompt"
                    >
                      {d.dayLabel}
                    </text>
                  </g>
                );
              })}

              {/* Area Fills */}
              {lineChartMetric === 'all' && (
                <path d={totalAreaPath} fill="url(#totalGradient)" />
              )}
              {(lineChartMetric === 'all' || lineChartMetric === 'rooms') && (
                <path d={roomAreaPath} fill="url(#roomGradient)" />
              )}
              {(lineChartMetric === 'all' || lineChartMetric === 'equipment') && (
                <path d={eqAreaPath} fill="url(#eqGradient)" />
              )}

              {/* Stroke Curves */}
              {lineChartMetric === 'all' && (
                <path
                  d={totalLinePath}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                />
              )}

              {(lineChartMetric === 'all' || lineChartMetric === 'equipment') && (
                <path
                  d={eqLinePath}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {(lineChartMetric === 'all' || lineChartMetric === 'rooms') && (
                <path
                  d={roomLinePath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#neonGlowSky)"
                />
              )}

              {/* Interactive Node Circles for Hover */}
              {data.weeklyTrends.map((d, i) => {
                const x = getX(i);
                const yRoom = getY(d.roomBookings);
                const yEq = getY(d.equipmentRequests);
                const isHovered = hoveredDayIndex === i;

                return (
                  <g key={i}>
                    {/* Transparent touch/hover trigger strip */}
                    <rect
                      x={x - 25}
                      y={paddingY}
                      width={50}
                      height={graphHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredDayIndex(i)}
                      onMouseLeave={() => setHoveredDayIndex(null)}
                    />

                    {/* Room Node */}
                    {(lineChartMetric === 'all' || lineChartMetric === 'rooms') && (
                      <circle
                        cx={x}
                        cy={yRoom}
                        r={isHovered ? 6 : 4}
                        fill="#030712"
                        stroke="#38bdf8"
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150 pointer-events-none"
                      />
                    )}

                    {/* Equipment Node */}
                    {(lineChartMetric === 'all' || lineChartMetric === 'equipment') && (
                      <circle
                        cx={x}
                        cy={yEq}
                        r={isHovered ? 6 : 3.5}
                        fill="#030712"
                        stroke="#818cf8"
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150 pointer-events-none"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Dynamic Glass Tooltip on Hover */}
            {hoveredDayIndex !== null && (
              <div
                className="absolute top-2 pointer-events-none glass-panel rounded-xl p-3 border border-cyan-400/40 text-xs shadow-2xl transition-all z-20"
                style={{
                  left: `${(hoveredDayIndex / (data.weeklyTrends.length - 1)) * 80 + 10}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="font-bold text-white mb-1 flex items-center justify-between gap-4 font-mono">
                  <span>วัน{data.weeklyTrends[hoveredDayIndex].dayLabel}</span>
                  <span className="text-[10px] text-cyan-300">
                    รวม {data.weeklyTrends[hoveredDayIndex].totalActivity} รายการ
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between gap-3 text-sky-300">
                    <span>🏢 จองห้องปฏิบัติการ:</span>
                    <span className="font-bold">{data.weeklyTrends[hoveredDayIndex].roomBookings} ครั้ง</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-indigo-300">
                    <span>💻 ขอยืมของส่วนกลาง:</span>
                    <span className="font-bold">{data.weeklyTrends[hoveredDayIndex].equipmentRequests} ชิ้น</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* กราฟวงกลม / โดนัท (Donut / Circle Chart) - 4 Columns */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-5 sm:p-7 border border-white/10 space-y-4">
          <div className="pb-2 border-b border-white/5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-400" />
              <span>กราฟวงกลมแสดงสัดส่วน (Donut Chart)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              แสดงการกระจายตัวของสถานะคำขอและหมวดหมู่ทรัพยากร
            </p>
          </div>

          {/* Donut Category Tabs */}
          <div className="flex rounded-lg bg-slate-950/70 p-1 border border-white/10 text-[11px]">
            <button
              onClick={() => setCircleChartTab('status')}
              className={`flex-1 py-1 rounded-md transition-all ${
                circleChartTab === 'status'
                  ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              สถานะคำขอ
            </button>
            <button
              onClick={() => setCircleChartTab('rooms')}
              className={`flex-1 py-1 rounded-md transition-all ${
                circleChartTab === 'rooms'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ห้องปฏิบัติการ
            </button>
            <button
              onClick={() => setCircleChartTab('equipment')}
              className={`flex-1 py-1 rounded-md transition-all ${
                circleChartTab === 'equipment'
                  ? 'bg-purple-500/25 text-purple-200 border border-purple-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              อุปกรณ์
            </button>
          </div>

          {/* Donut SVG Viewport */}
          <div className="relative flex items-center justify-center py-2">
            <svg
              width={donutSize}
              height={donutSize}
              viewBox={`0 0 ${donutSize} ${donutSize}`}
              className="transform -rotate-90"
            >
              {/* Background ring */}
              <circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={radius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={strokeWidth}
              />

              {/* Segments */}
              {donutSlices.map((slice) => {
                const isHovered = hoveredSliceKey === slice.key;
                return (
                  <circle
                    key={slice.key}
                    cx={donutSize / 2}
                    cy={donutSize / 2}
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSliceKey(slice.key)}
                    onMouseLeave={() => setHoveredSliceKey(null)}
                  />
                );
              })}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                {circleChartTab === 'status'
                  ? 'คำขอทั้งหมด'
                  : circleChartTab === 'rooms'
                  ? 'ยอดจองห้อง'
                  : 'ยอดอุปกรณ์'}
              </span>
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                {rawDonutTotal}
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">
                {rawDonutTotal > 0 ? '100% สัดส่วน' : 'ยังไม่มีข้อมูล'}
              </span>
            </div>
          </div>

          {/* Donut Legend List */}
          <div className="space-y-2 pt-1 border-t border-white/5 text-xs">
            {donutSlices.map((slice) => {
              const isHovered = hoveredSliceKey === slice.key;
              return (
                <div
                  key={slice.key}
                  onMouseEnter={() => setHoveredSliceKey(slice.key)}
                  onMouseLeave={() => setHoveredSliceKey(null)}
                  className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isHovered ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-slate-300 truncate">{slice.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="text-white font-semibold tabular-nums">{slice.count}</span>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      ({slice.percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Day-by-Day Table */}
      <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>ตารางแจกแจงสถิติรายวันประจำสัปดาห์ (Daily Breakdown Schedule)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              เปรียบเทียบปริมาณงานจองห้องและการยืมอุปกรณ์ส่วนกลางพร้อมแถบสถานะการกระจายงาน
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/40 self-start sm:self-auto">
            7 วันทำการต่อเนื่อง
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono">
                <th className="pb-2.5">วันในสัปดาห์</th>
                <th className="pb-2.5 text-center">จองห้องแล็บ</th>
                <th className="pb-2.5 text-center">ขอยืมอุปกรณ์</th>
                <th className="pb-2.5 text-center">กิจกรรมรวม</th>
                <th className="pb-2.5">สัดส่วนการกระจายงาน (Workload Ratio)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {data.weeklyTrends.map((row, idx) => {
                const totalPct = Math.round((row.totalActivity / data.summary.peakDayActivity) * 100);
                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-sans text-white font-medium">
                      วัน{row.dayLabel} <span className="text-slate-500 text-[11px]">({row.day})</span>
                    </td>
                    <td className="py-3 text-center text-sky-300 font-bold tabular-nums">
                      {row.roomBookings}
                    </td>
                    <td className="py-3 text-center text-indigo-300 font-bold tabular-nums">
                      {row.equipmentRequests}
                    </td>
                    <td className="py-3 text-center text-emerald-300 font-bold tabular-nums">
                      {row.totalActivity}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-36 sm:w-56 h-2 rounded-full bg-slate-800 overflow-hidden flex">
                          <div
                            style={{
                              width: `${(row.roomBookings / row.totalActivity) * totalPct}%`,
                            }}
                            className="h-full bg-sky-400"
                            title="สัดส่วนห้องแล็บ"
                          />
                          <div
                            style={{
                              width: `${(row.equipmentRequests / row.totalActivity) * totalPct}%`,
                            }}
                            className="h-full bg-indigo-500"
                            title="สัดส่วนอุปกรณ์"
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 tabular-nums">{totalPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
