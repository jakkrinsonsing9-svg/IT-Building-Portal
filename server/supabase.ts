import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_CONFIG_FILE = path.resolve(process.cwd(), 'supabase-config.json');

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  enabled: boolean;
  connectedAt?: string;
}

export const SUPABASE_SQL_SCHEMA = `-- ================================================================
-- Schema สำหรับระบบ IT Operations & Resource Portal บน Supabase PostgreSQL
-- สามารถคัดลอกคำสั่งทั้งหมดนี้ไปวางใน Supabase Dashboard -> SQL Editor แล้วกด RUN
-- ================================================================

-- 1. ตารางผู้ใช้งาน (users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  student_or_staff_id TEXT,
  citizen_id TEXT,
  phone TEXT,
  department TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางห้องปฏิบัติการ (rooms)
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  floor INTEGER DEFAULT 1,
  capacity INTEGER DEFAULT 30,
  type TEXT DEFAULT 'lab',
  description TEXT,
  equipment JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'available',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางครุภัณฑ์และอุปกรณ์ไอที (equipment)
CREATE TABLE IF NOT EXISTS public.equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'computing',
  serial_number TEXT,
  specs TEXT,
  total_quantity INTEGER DEFAULT 1,
  available_quantity INTEGER DEFAULT 1,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางการจองห้อง (room_bookings)
CREATE TABLE IF NOT EXISTS public.room_bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  user_student_id TEXT,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  room_code TEXT,
  room_name TEXT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  purpose TEXT,
  attendees_count INTEGER DEFAULT 1,
  requested_facilities JSONB DEFAULT '[]'::jsonb,
  advisor_name TEXT,
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางการยืม-คืนอุปกรณ์ (equipment_requests)
CREATE TABLE IF NOT EXISTS public.equipment_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  equipment_id TEXT REFERENCES public.equipment(id) ON DELETE CASCADE,
  equipment_name TEXT,
  quantity INTEGER DEFAULT 1,
  borrow_date TEXT NOT NULL,
  expected_return_date TEXT NOT NULL,
  usage_location TEXT,
  project_purpose TEXT,
  emergency_contact TEXT,
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตารางบันทึกความปลอดภัย (security_audit_logs)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  event_type TEXT NOT NULL,
  user_id TEXT,
  user_email TEXT,
  user_role TEXT,
  ip_address TEXT,
  action TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  details JSONB
);

-- เปิดใช้งาน Row Level Security (RLS) เพื่อความปลอดภัย
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy ให้ API / Backend เข้าถึงได้
DROP POLICY IF EXISTS "Allow all for authenticated/anon keys" ON public.rooms;
CREATE POLICY "Allow all for authenticated/anon keys" ON public.rooms FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated/anon keys" ON public.equipment;
CREATE POLICY "Allow all for authenticated/anon keys" ON public.equipment FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated/anon keys" ON public.room_bookings;
CREATE POLICY "Allow all for authenticated/anon keys" ON public.room_bookings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated/anon keys" ON public.equipment_requests;
CREATE POLICY "Allow all for authenticated/anon keys" ON public.equipment_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated/anon keys" ON public.users;
CREATE POLICY "Allow all for authenticated/anon keys" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated/anon keys" ON public.security_audit_logs;
CREATE POLICY "Allow all for authenticated/anon keys" ON public.security_audit_logs FOR ALL USING (true);
`;

class SupabaseManager {
  private config: SupabaseConfig;
  private client: SupabaseClient | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.initClient();
  }

  private loadConfig(): SupabaseConfig {
    try {
      if (fs.existsSync(SUPABASE_CONFIG_FILE)) {
        const raw = fs.readFileSync(SUPABASE_CONFIG_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to read supabase-config.json', err);
    }

    // Fallback to process.env
    const url = process.env.SUPABASE_URL || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    return {
      url,
      anonKey,
      serviceRoleKey,
      enabled: Boolean(url && (anonKey || serviceRoleKey)),
    };
  }

  public saveConfig(config: Partial<SupabaseConfig>): SupabaseConfig {
    this.config = {
      ...this.config,
      ...config,
    };
    try {
      fs.writeFileSync(SUPABASE_CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write supabase-config.json', err);
    }
    this.initClient();
    return this.config;
  }

  public getConfig(): {
    url: string;
    hasKey: boolean;
    hasServiceKey: boolean;
    enabled: boolean;
    connectedAt?: string;
  } {
    return {
      url: this.config.url || '',
      hasKey: Boolean(this.config.anonKey),
      hasServiceKey: Boolean(this.config.serviceRoleKey),
      enabled: this.config.enabled && Boolean(this.client),
      connectedAt: this.config.connectedAt,
    };
  }

  private initClient(): void {
    const key = this.config.serviceRoleKey || this.config.anonKey;
    if (this.config.url && key) {
      try {
        this.client = createClient(this.config.url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public isConnected(): boolean {
    return Boolean(this.client && this.config.enabled);
  }

  public async testConnection(url?: string, key?: string): Promise<{ success: boolean; message: string; details?: any }> {
    const targetUrl = url || this.config.url;
    const targetKey = key || this.config.serviceRoleKey || this.config.anonKey;

    if (!targetUrl || !targetKey) {
      return { success: false, message: 'กรุณากรอก Supabase Project URL และ API Key (Anon Key หรือ Service Role Key)' };
    }

    try {
      const testClient = createClient(targetUrl, targetKey);
      // Attempt a lightweight request to Supabase API
      const { data, error } = await testClient.from('rooms').select('count', { count: 'exact', head: true });

      if (error) {
        // If error is code 42P01 (relation does not exist), the connection to Supabase was successful,
        // but tables just need to be created with the SQL Schema!
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return {
            success: true,
            message: 'เชื่อมต่อ Supabase สำเร็จแล้ว! (ตรวจพบโปรเจกต์ แต่ยังไม่ได้รัน SQL Schema สร้างตาราง - กรุณารัน SQL Schema ใน SQL Editor)',
            details: { tablesCreated: false, error: error.message },
          };
        }
        return { success: false, message: `การเชื่อมต่อล้มเหลว: ${error.message}`, details: error };
      }

      return {
        success: true,
        message: 'เชื่อมต่อ Supabase และตรวจพบตารางฐานข้อมูลเรียบร้อยสมบูรณ์!',
        details: { tablesCreated: true, count: data },
      };
    } catch (err: any) {
      return { success: false, message: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message || String(err)}` };
    }
  }

  /**
   * Sync existing in-memory/JSON data up to Supabase tables
   */
  public async syncDataToSupabase(data: {
    users: any[];
    rooms: any[];
    equipment: any[];
    bookings: any[];
    equipmentRequests: any[];
    auditLogs: any[];
  }): Promise<{ success: boolean; message: string; results?: Record<string, number | string> }> {
    if (!this.client) {
      return { success: false, message: 'Supabase ยังไม่ได้เชื่อมต่อ' };
    }

    const results: Record<string, number | string> = {};

    try {
      // 1. Sync Rooms
      if (data.rooms?.length) {
        const mappedRooms = data.rooms.map((r) => ({
          id: r.id,
          name: r.name,
          code: r.code,
          floor: r.floor,
          capacity: r.capacity,
          type: r.type,
          description: r.description,
          equipment: r.equipment,
          status: r.status,
          image_url: r.imageUrl,
        }));
        const { error: roomErr } = await this.client.from('rooms').upsert(mappedRooms);
        results.rooms = roomErr ? `เกิดข้อผิดพลาด: ${roomErr.message}` : mappedRooms.length;
      }

      // 2. Sync Equipment
      if (data.equipment?.length) {
        const mappedEquipment = data.equipment.map((e) => ({
          id: e.id,
          name: e.name,
          category: e.category,
          serial_number: e.serialNumber,
          specs: e.specs,
          total_quantity: e.totalQuantity,
          available_quantity: e.availableQuantity,
          location: e.location,
          image_url: e.imageUrl,
        }));
        const { error: eqErr } = await this.client.from('equipment').upsert(mappedEquipment);
        results.equipment = eqErr ? `เกิดข้อผิดพลาด: ${eqErr.message}` : mappedEquipment.length;
      }

      // 3. Sync Users
      if (data.users?.length) {
        const mappedUsers = data.users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          student_or_staff_id: u.studentOrStaffId,
          citizen_id: u.citizenId,
          phone: u.phone,
          department: u.department,
          password_hash: u.passwordHash,
          created_at: u.createdAt,
        }));
        const { error: userErr } = await this.client.from('users').upsert(mappedUsers);
        results.users = userErr ? `เกิดข้อผิดพลาด: ${userErr.message}` : mappedUsers.length;
      }

      // 4. Sync Bookings
      if (data.bookings?.length) {
        const mappedBookings = data.bookings.map((b) => ({
          id: b.id,
          user_id: b.userId,
          user_name: b.userName,
          user_email: b.userEmail,
          user_phone: b.userPhone,
          user_student_id: b.userStudentId,
          room_id: b.roomId,
          room_code: b.roomCode,
          room_name: b.roomName,
          date: b.date,
          start_time: b.startTime,
          end_time: b.endTime,
          purpose: b.purpose,
          attendees_count: b.attendeesCount,
          requested_facilities: b.requestedFacilities,
          advisor_name: b.advisorName,
          status: b.status,
          admin_note: b.adminNote,
          created_at: b.createdAt,
          updated_at: b.updatedAt,
        }));
        const { error: bkErr } = await this.client.from('room_bookings').upsert(mappedBookings);
        results.bookings = bkErr ? `เกิดข้อผิดพลาด: ${bkErr.message}` : mappedBookings.length;
      }

      // 5. Sync Equipment Requests
      if (data.equipmentRequests?.length) {
        const mappedReqs = data.equipmentRequests.map((eq) => ({
          id: eq.id,
          user_id: eq.userId,
          user_name: eq.userName,
          user_email: eq.userEmail,
          user_phone: eq.userPhone,
          equipment_id: eq.equipmentId,
          equipment_name: eq.equipmentName,
          quantity: eq.quantity,
          borrow_date: eq.borrowDate,
          expected_return_date: eq.expectedReturnDate,
          usage_location: eq.usageLocation,
          project_purpose: eq.projectPurpose,
          emergency_contact: eq.emergencyContact,
          status: eq.status,
          admin_note: eq.adminNote,
          created_at: eq.createdAt,
          updated_at: eq.updatedAt,
        }));
        const { error: reqErr } = await this.client.from('equipment_requests').upsert(mappedReqs);
        results.equipmentRequests = reqErr ? `เกิดข้อผิดพลาด: ${reqErr.message}` : mappedReqs.length;
      }

      return {
        success: true,
        message: 'ซิงค์ข้อมูลไปยัง Supabase เรียบร้อยแล้ว!',
        results,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `เกิดข้อผิดพลาดขณะซิงค์: ${err.message || String(err)}`,
        results,
      };
    }
  }
}

export const supabaseManager = new SupabaseManager();
