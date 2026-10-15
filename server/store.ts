import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  UserWithSensitive,
  UserApprovalStatus,
  Room,
  Equipment,
  RoomBooking,
  EquipmentRequest,
  SecurityAuditLog,
  OWASPScanReport,
  SatisfactionFeedback,
} from '../src/types/index.ts';
import { supabaseManager } from './supabase.ts';

const DB_FILE = path.resolve(process.cwd(), 'database.json');

interface DatabaseSchema {
  users: UserWithSensitive[];
  rooms: Room[];
  equipment: Equipment[];
  bookings: RoomBooking[];
  equipmentRequests: EquipmentRequest[];
  auditLogs: SecurityAuditLog[];
  feedbacks: SatisfactionFeedback[];
}

function getInitialData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@Pass1234', salt);

  const users: UserWithSensitive[] = [
    {
      id: 'usr-admin-001',
      email: 'admin@it.ac.th',
      name: 'ผู้ดูแลระบบไอที (System Administrator)',
      role: 'admin',
      studentOrStaffId: 'STF-9901',
      citizenId: '1100200112233',
      phone: '0812345678',
      department: 'ศูนย์บริการสารสนเทศและเทคโนโลยี (IT Operations)',
      approvalStatus: 'approved',
      createdAt: new Date().toISOString(),
      passwordHash: adminHash,
    },
    {
      id: 'usr-user-002',
      email: 'jakkrinsonsing1@gmail.com',
      name: 'Jakkrin Sonsing',
      role: 'user',
      studentOrStaffId: 'STD-65010023',
      citizenId: '1100200987654',
      phone: '0891234567',
      department: 'สาขาวิทยาการคอมพิวเตอร์',
      approvalStatus: 'approved',
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync('User@Pass1234', salt),
    },
    {
      id: 'usr-user-003',
      email: 't14583925@gmail.com',
      name: 'IT Member Account',
      role: 'user',
      studentOrStaffId: 'STD-65010088',
      citizenId: '1100200456789',
      phone: '0867890123',
      department: 'สาขาเทคโนโลยีสารสนเทศ',
      approvalStatus: 'approved',
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync('User@Pass1234', salt),
    },
  ];

  const rooms: Room[] = [
    {
      id: 'room-cybersec',
      name: 'ห้องปฏิบัติการ Cybersecurity (Cyber Defense & Offensive Security Lab)',
      code: 'LAB-CYBER',
      floor: 4,
      capacity: 36,
      type: 'lab',
      description: 'ห้องปฏิบัติการความมั่นคงปลอดภัยไซเบอร์ แยกเครือข่ายทดสอบแบบ Isolated Sandbox รองรับการซ้อมแข่งขัน CTF, Penetration Testing, Malware Analysis และ SOC Monitoring',
      equipment: ['36x High-Sec Terminals (Dual Display)', 'Dedicated Hardware Firewall Sandbox', 'Kali Linux & Threat Defense Cluster', 'จอแสดงผล SOC Live Threat Map'],
      status: 'available',
      imageUrl: '/src/assets/images/cybersecurity_lab_1791646568756.jpg',
    },
    {
      id: 'room-network',
      name: 'ห้องปฏิบัติการ Network (Computer Network & Cloud Infrastructure Lab)',
      code: 'LAB-NET',
      floor: 3,
      capacity: 40,
      type: 'lab',
      description: 'ห้องปฏิบัติการเครือข่ายคอมพิวเตอร์และระบบคลาวด์ พร้อมตู้ Server Rack, Cisco Enterprise Switches, Routers และชุดทดสอบใยแก้วนำแสงความเร็วสูง',
      equipment: ['40x Network Engineering Workstations', '10x Cisco Modular Router & Switch Racks', 'Fiber Optic Splicing & Fluke Testers', 'Wireshark Packet Analysis Center'],
      status: 'available',
      imageUrl: '/src/assets/images/network_lab_1791646586644.jpg',
    },
    {
      id: 'room-studio',
      name: 'ห้อง Studio (Digital Multimedia & Live Streaming Studio)',
      code: 'STUDIO-201',
      floor: 2,
      capacity: 25,
      type: 'studio',
      description: 'สตูดิโอดิจิทัลและผลิตสื่อสร้างสรรค์ ผนังเก็บเสียง Acoustic Board ติดตั้งฉาก Chroma Green Screen ไฟสตูดิโอมืออาชีพ และระบบ Live Streaming สัมมนาและ Podcast คุณภาพสูง',
      equipment: ['Sony 4K Studio Cameras & Blackmagic Switcher', 'Acoustic Wall Soundproofing & Green Screen', 'Rode PodMic Studio Audio Rig', 'Elgato Stream Deck & Pro Lighting Grid'],
      status: 'available',
      imageUrl: '/src/assets/images/media_studio_1791646607451.jpg',
    },
    {
      id: 'room-lounge-1',
      name: 'ห้องนั่งเล่น 1 (Student Lounge 1 - Co-Working & Relax Space)',
      code: 'LOUNGE-101',
      floor: 1,
      capacity: 30,
      type: 'lounge',
      description: 'ห้องนั่งเล่นโซน 1 สำหรับนักศึกษาและบุคลากรไอที พื้นที่ Co-working พักผ่อน โซฟานุ่ม บีนแบ็ก พร้อมจุดชาร์จไฟความเร็วสูงและ Smart TV',
      equipment: ['Ergonomic Sectional Sofas & Bean Bags', 'High-Speed Wireless Charging Stations', 'Smart TV 75" สำหรับ Screen Cast & พรีเซนต์', 'Whiteboard Wall & Coffee/Tea Station'],
      status: 'available',
      imageUrl: '/src/assets/images/student_lounge_1791646630711.jpg',
    },
    {
      id: 'room-lounge-2',
      name: 'ห้องนั่งเล่น 2 (Student Lounge 2 - Creative Brainstorming Pod)',
      code: 'LOUNGE-102',
      floor: 1,
      capacity: 25,
      type: 'lounge',
      description: 'ห้องนั่งเล่นโซน 2 ออกแบบเพื่อการระดมสมองแบบกลุ่มย่อย โต๊ะทรงรีปรับระดับได้ กระดานกระจกเขียนไอเดียรอบทิศทาง และบีนแบ็กผ่อนคลาย',
      equipment: ['Modular Discussion Tables & Soft Seating', 'Interactive Idea Glass Whiteboard', 'USB-C Rapid Power Outlets', 'Ambient Sound Masking System'],
      status: 'available',
      imageUrl: '/src/assets/images/student_lounge_1791646630711.jpg',
    },
    {
      id: 'room-lounge-3',
      name: 'ห้องนั่งเล่น 3 (Student Lounge 3 - Silent Reading & Focus Corner)',
      code: 'LOUNGE-201',
      floor: 2,
      capacity: 20,
      type: 'lounge',
      description: 'ห้องนั่งเล่นโซน 3 มุมเงียบสงบสำหรับอ่านหนังสือ ทบทวนบทเรียน และทำสมาธิ เก้าอี้เลานจ์ตามหลักสรีรศาสตร์พร้อมโคมไฟอ่านหนังสือเฉพาะบุคคล',
      equipment: ['Ergonomic Acoustic High-Back Lounge Chairs', 'Individual LED Reading Task Lights', 'Noise-Dampening Felt Wall Panels', 'Dedicated Quiet Study Carrels'],
      status: 'available',
      imageUrl: '/src/assets/images/student_lounge_1791646630711.jpg',
    },
    {
      id: 'room-lounge-4',
      name: 'ห้องนั่งเล่น 4 (Student Lounge 4 - Digital Media & Esports Zone)',
      code: 'LOUNGE-202',
      floor: 2,
      capacity: 35,
      type: 'lounge',
      description: 'ห้องนั่งเล่นโซน 4 พื้นที่ความบันเทิงและสันทนาการดิจิทัล รองรับการจัดกิจกรรม Esports นั่งชมการแข่งขัน ดูภาพยนตร์ และทำกิจกรรมชมรมร่วมกัน',
      equipment: ['Dual Ultra-Wide 85" 4K Display Wall', 'PlayStation 5 & Nintendo Switch Console Station', 'Surround Sound Theater Speakers', 'Tiered Stadium Soft Poufs & Beanbags'],
      status: 'available',
      imageUrl: '/src/assets/images/student_lounge_1791646630711.jpg',
    },
    {
      id: 'room-401',
      name: 'High Performance AI & Deep Learning Lab',
      code: 'LAB-401',
      floor: 4,
      capacity: 45,
      type: 'lab',
      description: 'ห้องปฏิบัติการคอมพิวเตอร์สมรรถนะสูง ติดตั้งเวิร์กสเตชัน Intel Core i9 เชื่อมต่อ GPU Server สำหรับงานปัญญาประดิษฐ์และวิทยาการข้อมูล',
      equipment: ['45x AI Workstations (RTX 4080)', 'จอสัมผัส Smartboard 86"', 'ระบบเสียงสัมมนารอบทิศทาง', 'Gigabit Ethernet Drop'],
      status: 'available',
      imageUrl: '/src/assets/images/it_lab_interior_1791567709768.jpg',
    },
    {
      id: 'room-301',
      name: 'IT Executive Innovation & Conference Suite',
      code: 'MEET-301',
      floor: 3,
      capacity: 20,
      type: 'meeting',
      description: 'ห้องประชุมผู้บริหารและคณะกรรมการวิจัย ติดตั้งระบบ Video Conference ไฮบริดระดับองค์กร พร้อมระบบจองโต๊ะและแสงสว่างอัจฉริยะ',
      equipment: ['4K Dual Video Conference PTZ Camera', 'Beamforming Ceiling Microphones', 'AirPlay & Miracast Gateway'],
      status: 'available',
      imageUrl: '/src/assets/images/it_building_hero_1791567692594.jpg',
    },
  ];

  const equipment: Equipment[] = [
    {
      id: 'eq-mouse-01',
      name: 'Mouse ไร้สายทำงานและเขียนโปรแกรม (Logitech & Ergonomic Wireless Mouse)',
      category: 'mouse',
      serialNumber: 'MSE-ERGO-IT-101',
      specs: 'เซนเซอร์ความแม่นยำสูง 4000 DPI, รองรับบลูทูธและ USB Receiver, ปุ่มกด Silent Click ไร้เสียงรบกวน พร้อมแท่นชาร์จ USB-C',
      totalQuantity: 30,
      availableQuantity: 30,
      location: 'เคาน์เตอร์เบิกจ่ายอุปกรณ์ส่วนกลาง ชั้น 1 (IT Service Desk)',
      imageUrl: '/src/assets/images/equipment_mouse_1791648865268.jpg',
    },
    {
      id: 'eq-mouse-02',
      name: 'Mouse เกมมิ่งความแม่นยำสูง (High-Polling Rate Esports Gaming Mouse)',
      category: 'mouse',
      serialNumber: 'MSE-GAME-IT-102',
      specs: 'เซนเซอร์ Focus Pro 30K DPI, Polling Rate 8000Hz, สวิตช์ Optical V3 น้ำหนักเบาพิเศษ 58g สำหรับงานที่ต้องการความแม่นยำสูง',
      totalQuantity: 25,
      availableQuantity: 25,
      location: 'เคาน์เตอร์เบิกจ่ายอุปกรณ์ส่วนกลาง ชั้น 1 (IT Service Desk)',
      imageUrl: '/src/assets/images/equipment_mouse_1791648865268.jpg',
    },
    {
      id: 'eq-kbd-01',
      name: 'Keyboard แมคคานิคอลสำหรับการเขียนโค้ด (Custom Mechanical Keyboard - Hot Swappable)',
      category: 'keyboard',
      serialNumber: 'KBD-MECH-IT-201',
      specs: 'Hot-swap Red Linear Switches (พิมพ์นุ่มเงียบ), Layout 75% พร้อม Knob ปรับเสียง, ไฟ RGB, เชื่อมต่อ Bluetooth / 2.4G / Type-C',
      totalQuantity: 25,
      availableQuantity: 25,
      location: 'เคาน์เตอร์เบิกจ่ายอุปกรณ์ส่วนกลาง ชั้น 1 (IT Service Desk)',
      imageUrl: '/src/assets/images/equipment_keyboard_1791648890529.jpg',
    },
    {
      id: 'eq-kbd-02',
      name: 'Keyboard ไร้สายเพื่อสุขภาพ (Ergonomic Split Wireless Keyboard)',
      category: 'keyboard',
      serialNumber: 'KBD-ERGO-IT-202',
      specs: 'ดีไซน์แยกชิ้นรองรับสรีระมือและข้อมือ พร้อมเบาะรองข้อมือเมมโมรี่โฟม ลดอาการออฟฟิศซินโดรม เชื่อมต่อ 3 อุปกรณ์พร้อมกัน',
      totalQuantity: 20,
      availableQuantity: 20,
      location: 'เคาน์เตอร์เบิกจ่ายอุปกรณ์ส่วนกลาง ชั้น 1 (IT Service Desk)',
      imageUrl: '/src/assets/images/equipment_keyboard_1791648890529.jpg',
    },
    {
      id: 'eq-gpu-01',
      name: 'การ์ดจอ NVIDIA GeForce RTX 4080 Super 16GB (AI / Render GPU)',
      category: 'gpu',
      serialNumber: 'GPU-RTX4080-IT-301',
      specs: '16GB GDDR6X VRAM, Ada Lovelace Architecture, 10,240 CUDA Cores, 4th Gen Tensor Cores สำหรับ Deep Learning และงาน 3D',
      totalQuantity: 10,
      availableQuantity: 10,
      location: 'ห้องแล็บคอมพิวเตอร์สมรรถนะสูง ชั้น 4 (LAB-401)',
      imageUrl: '/src/assets/images/equipment_gpu_1791648914162.jpg',
    },
    {
      id: 'eq-gpu-02',
      name: 'การ์ดจอ NVIDIA GeForce RTX 4070 Ti Super 16GB',
      category: 'gpu',
      serialNumber: 'GPU-RTX4070TI-IT-302',
      specs: '16GB GDDR6X, Triple Fan Cooling System, สถาปัตยกรรม 256-bit สำหรับประมวลผลงานวิจัย Computer Vision และโครงงานนักศึกษา',
      totalQuantity: 12,
      availableQuantity: 12,
      location: 'ห้องปฏิบัติการวิจัยและพัฒนา ชั้น 4 (LAB-401)',
      imageUrl: '/src/assets/images/equipment_gpu_1791648914162.jpg',
    },
    {
      id: 'eq-lan-01',
      name: 'สายแลน Cat6 / Cat7 High-Speed Patch Cord (ชุดความยาว 3m - 15m)',
      category: 'network',
      serialNumber: 'LAN-CAT7-IT-401',
      specs: 'ความเร็วส่งข้อมูล 10Gbps / 600MHz, ปลอกฉนวนชีลด์กันสัญญาณรบกวน STP พร้อมหัวเคลือบทอง RJ45 สำหรับทดสอบระบบเครือข่ายและใช้งานทั่วไป',
      totalQuantity: 50,
      availableQuantity: 50,
      location: 'ห้องปฏิบัติการเครือข่าย Network Lab ชั้น 3 (LAB-NET)',
      imageUrl: '/src/assets/images/equipment_lancable_1791648939295.jpg',
    },
    {
      id: 'eq-cam-01',
      name: 'กล้องและอุปกรณ์เสริมต่างๆ (ชุดสตรีมมิ่ง 4K Pro Streaming Kit + ขาตั้ง & Ring Light)',
      category: 'media',
      serialNumber: 'CAM-STRM-IT-501',
      specs: 'เว็บแคม 4K Ultra HD พร้อม AI Auto-Framing, ขาตั้ง Manfrotto Mini Tripod, ไฟสตูดิโอ Bi-color Ring Light และตัวแปลง HDMI Capture Card',
      totalQuantity: 15,
      availableQuantity: 15,
      location: 'ห้องศูนย์สื่อและมัลติมีเดีย ชั้น 2 (STUDIO-201)',
      imageUrl: '/src/assets/images/equipment_camera_1791648975276.jpg',
    },
    {
      id: 'eq-cam-02',
      name: 'กล้องและอุปกรณ์เสริมต่างๆ (ชุดกล้องดิจิทัล Mirrorless พร้อมขาตั้งกล้องและไมค์ไวร์เลส)',
      category: 'media',
      serialNumber: 'CAM-MIRROR-IT-502',
      specs: 'Sony Alpha Kit เลนส์ซูม 24-70mm f/2.8, ขาตั้งกล้อง Carbon Fiber, แบตเตอรี่สำรอง 3 ก้อน, เมมโมรี่การ์ด 128GB V90 และไมโครโฟนไร้สายติดเสื้อ 2 ตัว',
      totalQuantity: 8,
      availableQuantity: 8,
      location: 'ห้องศูนย์สื่อและมัลติมีเดีย ชั้น 2 (STUDIO-201)',
      imageUrl: '/src/assets/images/equipment_camera_1791648975276.jpg',
    },
  ];

  const bookings: RoomBooking[] = [];
  const equipmentRequests: EquipmentRequest[] = [];
  const auditLogs: SecurityAuditLog[] = [];
  const feedbacks: SatisfactionFeedback[] = [];
  return {
    users,
    rooms,
    equipment,
    bookings,
    equipmentRequests,
    auditLogs,
    feedbacks,
  };
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const initial = getInitialData();
        // Check if rooms need sync for the 4 lounges or if equipment needs refresh
        const hasLounges = parsed.rooms && parsed.rooms.some((r: any) => r.id === 'room-lounge-4');
        const hasNewEquipment = parsed.equipment && parsed.equipment.some((e: any) => e.id === 'eq-mouse-01');
        
        let shouldSave = false;
        if (!hasLounges) {
          parsed.rooms = initial.rooms;
          shouldSave = true;
        }
        if (!hasNewEquipment || parsed.equipment?.some((e: any) => e.id === 'eq-001')) {
          parsed.equipment = initial.equipment;
          shouldSave = true;
        }
        if (!Array.isArray(parsed.feedbacks)) {
          parsed.feedbacks = [];
          shouldSave = true;
        }
        if (shouldSave) {
          this.save(parsed);
        }
        return parsed;
      }
    } catch (err) {
      console.error('Failed to load database.json, reinitializing...', err);
    }
    const initial = getInitialData();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema): void {
    const data = dataToSave || this.data;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database.json', err);
    }
    this.mirrorToSupabase();
  }

  public getAllData(): DatabaseSchema {
    return this.data;
  }

  public mirrorToSupabase(): void {
    if (supabaseManager.isConnected()) {
      supabaseManager.syncDataToSupabase(this.data).catch((err) => {
        console.warn('Background Supabase sync notice:', err?.message || err);
      });
    }
  }

  public resetAllData(): void {
    const initial = getInitialData();
    this.data = initial;
    this.save(initial);
    this.mirrorToSupabase();
  }

  public getUsers(): UserWithSensitive[] {
    return this.data.users;
  }

  public findUserByEmail(email: string): UserWithSensitive | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): UserWithSensitive | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public addUser(user: UserWithSensitive): void {
    this.data.users.push(user);
    this.save();
  }

  public updateUserPassword(email: string, passwordHash: string): boolean {
    const user = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    user.passwordHash = passwordHash;
    this.save();
    return true;
  }

  public updateUserVerification(userId: string, studentOrStaffId: string, department: string): UserWithSensitive | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.studentOrStaffId = studentOrStaffId.trim();
    user.department = department.trim();
    user.approvalStatus = 'pending_approval';
    this.save();
    return user;
  }

  public updateUserApprovalStatus(userId: string, status: UserApprovalStatus): UserWithSensitive | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.approvalStatus = status;
    this.save();
    return user;
  }

  public getRooms(): Room[] {
    return this.data.rooms;
  }

  public getRoomById(id: string): Room | undefined {
    return this.data.rooms.find((r) => r.id === id);
  }

  public addRoom(room: Room): void {
    this.data.rooms.push(room);
    this.save();
  }

  public updateRoom(id: string, updates: Partial<Room>): Room | undefined {
    const index = this.data.rooms.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    this.data.rooms[index] = { ...this.data.rooms[index], ...updates };
    this.save();
    return this.data.rooms[index];
  }

  public getEquipment(): Equipment[] {
    return this.data.equipment;
  }

  public getEquipmentById(id: string): Equipment | undefined {
    return this.data.equipment.find((e) => e.id === id);
  }

  public addEquipment(item: Equipment): void {
    this.data.equipment.push(item);
    this.save();
  }

  public updateEquipment(id: string, updates: Partial<Equipment>): Equipment | undefined {
    const index = this.data.equipment.findIndex((e) => e.id === id);
    if (index === -1) return undefined;
    this.data.equipment[index] = { ...this.data.equipment[index], ...updates };
    this.save();
    return this.data.equipment[index];
  }

  // Bookings CRUD
  public getBookings(): RoomBooking[] {
    return this.data.bookings;
  }

  public getBookingById(id: string): RoomBooking | undefined {
    return this.data.bookings.find((b) => b.id === id);
  }

  public addBooking(booking: RoomBooking): void {
    this.data.bookings.unshift(booking);
    this.save();
  }

  public updateBooking(id: string, updates: Partial<RoomBooking>): RoomBooking | undefined {
    const index = this.data.bookings.findIndex((b) => b.id === id);
    if (index === -1) return undefined;
    this.data.bookings[index] = {
      ...this.data.bookings[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.bookings[index];
  }

  public deleteBooking(id: string): boolean {
    const index = this.data.bookings.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.data.bookings.splice(index, 1);
    this.save();
    return true;
  }

  // Equipment Requests CRUD
  public getEquipmentRequests(): EquipmentRequest[] {
    return this.data.equipmentRequests;
  }

  public getEquipmentRequestById(id: string): EquipmentRequest | undefined {
    return this.data.equipmentRequests.find((r) => r.id === id);
  }

  public addEquipmentRequest(req: EquipmentRequest): void {
    this.data.equipmentRequests.unshift(req);
    // Decrease available quantity if exists
    const eq = this.getEquipmentById(req.equipmentId);
    if (eq && eq.availableQuantity >= req.quantity) {
      eq.availableQuantity -= req.quantity;
    }
    this.save();
  }

  public updateEquipmentRequest(
    id: string,
    updates: Partial<EquipmentRequest>
  ): EquipmentRequest | undefined {
    const index = this.data.equipmentRequests.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    const old = this.data.equipmentRequests[index];

    // If status changed to returned, restore equipment qty
    if (updates.status === 'returned' && old.status !== 'returned') {
      const eq = this.getEquipmentById(old.equipmentId);
      if (eq) {
        eq.availableQuantity = Math.min(eq.totalQuantity, eq.availableQuantity + old.quantity);
      }
    }

    this.data.equipmentRequests[index] = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.equipmentRequests[index];
  }

  public deleteEquipmentRequest(id: string): boolean {
    const index = this.data.equipmentRequests.findIndex((r) => r.id === id);
    if (index === -1) return false;
    const item = this.data.equipmentRequests[index];
    if (item.status === 'approved' || item.status === 'borrowed') {
      const eq = this.getEquipmentById(item.equipmentId);
      if (eq) {
        eq.availableQuantity = Math.min(eq.totalQuantity, eq.availableQuantity + item.quantity);
      }
    }
    this.data.equipmentRequests.splice(index, 1);
    this.save();
    return true;
  }

  // Audit Logs
  public getAuditLogs(): SecurityAuditLog[] {
    return this.data.auditLogs;
  }

  public addAuditLog(log: Omit<SecurityAuditLog, 'id' | 'timestamp'>): SecurityAuditLog {
    const newLog: SecurityAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.data.auditLogs.unshift(newLog);
    // Keep max 200 logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.save();
    return newLog;
  }

  // Feedback and Satisfaction (Real user data only, no mock data)
  public getFeedbacks(): SatisfactionFeedback[] {
    return this.data.feedbacks || [];
  }

  public addFeedback(feedback: SatisfactionFeedback): SatisfactionFeedback {
    if (!this.data.feedbacks) {
      this.data.feedbacks = [];
    }
    if (!feedback.helpfulUserIds) {
      feedback.helpfulUserIds = [];
    }
    this.data.feedbacks.unshift(feedback);
    this.save();
    return feedback;
  }

  public toggleHelpful(feedbackId: string, userId: string): { helpfulCount: number; userVoted: boolean; feedback: SatisfactionFeedback } | null {
    if (!this.data.feedbacks) {
      this.data.feedbacks = [];
    }
    const item = this.data.feedbacks.find((f) => f.id === feedbackId);
    if (!item) return null;

    if (!Array.isArray(item.helpfulUserIds)) {
      item.helpfulUserIds = [];
    }

    const index = item.helpfulUserIds.indexOf(userId);
    let userVoted = false;
    if (index > -1) {
      item.helpfulUserIds.splice(index, 1);
      userVoted = false;
    } else {
      item.helpfulUserIds.push(userId);
      userVoted = true;
    }

    this.save();
    return {
      helpfulCount: item.helpfulUserIds.length,
      userVoted,
      feedback: item,
    };
  }

  public getFeedbackStats(): {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [star: number]: number };
    cleanlinessAvg: number;
    speedAvg: number;
    staffAvg: number;
    recommendationRate: number;
  } {
    const list = this.getFeedbacks();
    if (list.length === 0) {
      return {
        averageRating: 5.0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        cleanlinessAvg: 5.0,
        speedAvg: 5.0,
        staffAvg: 5.0,
        recommendationRate: 100,
      };
    }

    const dist: { [star: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumRating = 0;
    let sumClean = 0;
    let sumSpeed = 0;
    let sumStaff = 0;
    let positiveCount = 0;

    for (const f of list) {
      const r = Math.min(5, Math.max(1, Math.round(f.rating)));
      dist[r] = (dist[r] || 0) + 1;
      sumRating += f.rating;
      sumClean += f.cleanlinessRating || f.rating;
      sumSpeed += f.speedRating || f.rating;
      sumStaff += f.staffRating || f.rating;
      if (f.rating >= 4) {
        positiveCount++;
      }
    }

    const count = list.length;
    return {
      averageRating: parseFloat((sumRating / count).toFixed(1)),
      totalReviews: count,
      ratingDistribution: dist,
      cleanlinessAvg: parseFloat((sumClean / count).toFixed(1)),
      speedAvg: parseFloat((sumSpeed / count).toFixed(1)),
      staffAvg: parseFloat((sumStaff / count).toFixed(1)),
      recommendationRate: Math.round((positiveCount / count) * 100),
    };
  }
}

export const store = new Store();

