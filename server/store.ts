import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  UserWithSensitive,
  Room,
  Equipment,
  RoomBooking,
  EquipmentRequest,
  SecurityAuditLog,
  OWASPScanReport,
} from '../src/types/index.ts';

const DB_FILE = path.resolve(process.cwd(), 'database.json');

interface DatabaseSchema {
  users: UserWithSensitive[];
  rooms: Room[];
  equipment: Equipment[];
  bookings: RoomBooking[];
  equipmentRequests: EquipmentRequest[];
  auditLogs: SecurityAuditLog[];
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
      createdAt: new Date().toISOString(),
      passwordHash: adminHash,
    },
  ];

  const rooms: Room[] = [
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
      id: 'room-402',
      name: 'Cyber Defense & Network Operations Lab',
      code: 'LAB-402',
      floor: 4,
      capacity: 40,
      type: 'lab',
      description: 'ห้องปฏิบัติการความมั่นคงปลอดภัยไซเบอร์ แยกเครือข่ายทดสอบแบบ Isolated Sandbox รองรับการซ้อมแข่งขัน CTF และ Penetration Testing',
      equipment: ['40x Security Terminals', 'Dedicated Hardware Firewall Sandbox', 'Dual 4K Projectors', 'Rack Patch Panels'],
      status: 'available',
      imageUrl: '/src/assets/images/it_lab_interior_1791567709768.jpg',
    },
    {
      id: 'room-202',
      name: 'VR/AR Multimedia & Spatial Computing Studio',
      code: 'STUDIO-202',
      floor: 2,
      capacity: 25,
      type: 'studio',
      description: 'สตูดิโอจำลองพื้นที่เสมือนจริง ติดตั้งเซ็นเซอร์ตรวจจับการเคลื่อนไหวรอบห้อง (Optical Motion Capture) และห้องเก็บเสียงสำหรับสื่อดิจิทัล',
      equipment: ['Motion Capture Ceiling Track', 'Chroma Green Wall 180°', 'Spatial Audio Monitor', 'VR Headset Calibration Rig'],
      status: 'available',
      imageUrl: '/src/assets/images/it_tech_devices_1791567729951.jpg',
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
    {
      id: 'room-105',
      name: 'IoT & Embedded Robotics Hardware Workshop',
      code: 'MAKER-105',
      floor: 1,
      capacity: 30,
      type: 'makerspace',
      description: 'ห้องปฏิบัติการประดิษฐ์ฮาร์ดแวร์ อุปกรณ์บัดกรีไร้ควัน เครื่องวัดสัญญาณ Oscilloscope และเครื่องพิมพ์ชิ้นงาน 3 มิติ',
      equipment: ['10x Soldering Stations with ESD Safe', 'Digital Oscilloscopes', '3D Rapid Prototyping Workbenches'],
      status: 'available',
      imageUrl: '/src/assets/images/it_tech_devices_1791567729951.jpg',
    },
  ];

  const equipment: Equipment[] = [
    {
      id: 'eq-001',
      name: 'Meta Quest 3 Mixed Reality VR Headset Kit',
      category: 'vr_ar',
      serialNumber: 'MQ3-2026-IT-0089',
      specs: '128GB Storage, Dual RGB Color Passthrough, Touch Plus Controllers + Active Straps, Carry Case',
      totalQuantity: 6,
      availableQuantity: 6,
      location: 'ห้องศูนย์สื่อและมัลติมีเดีย ชั้น 2 (STUDIO-202)',
      imageUrl: '/src/assets/images/it_tech_devices_1791567729951.jpg',
    },
    {
      id: 'eq-002',
      name: 'Apple MacBook Pro 16" (M3 Max / 64GB RAM)',
      category: 'computing',
      serialNumber: 'MBP-M3M-IT-0012',
      specs: '16-core CPU, 40-core GPU, 64GB Unified Memory, 2TB SSD, Space Black (รองรับงาน Render & ML)',
      totalQuantity: 4,
      availableQuantity: 4,
      location: 'ห้องบริการพัสดุและครุภัณฑ์คอมพิวเตอร์ ชั้น 3 (IT Inventory Room)',
      imageUrl: '/src/assets/images/it_lab_interior_1791567709768.jpg',
    },
    {
      id: 'eq-003',
      name: 'NVIDIA RTX 4090 24GB eGPU Acceleration Station',
      category: 'computing',
      serialNumber: 'EGPU-4090-IT-0034',
      specs: 'Thunderbolt 4 / USB4 eGPU Enclosure with RTX 4090 24GB VRAM สำหรับฝึกโมเดล AI นอกสถานที่',
      totalQuantity: 3,
      availableQuantity: 3,
      location: 'ห้องปฏิบัติการ AI Lab ชั้น 4 (LAB-401)',
      imageUrl: '/src/assets/images/it_tech_devices_1791567729951.jpg',
    },
    {
      id: 'eq-004',
      name: 'Cisco Catalyst 9300 48-Port PoE+ Enterprise Switch',
      category: 'network',
      serialNumber: 'CSCO-C9300-IT-0056',
      specs: '48x 1GbE PoE+ ports, Modular Uplinks (4x 10G SFP+), Console Cable Kit, Rackmount Brackets',
      totalQuantity: 5,
      availableQuantity: 5,
      location: 'ห้องเครือข่ายและความมั่นคง ชั้น 4 (LAB-402)',
      imageUrl: '/src/assets/images/it_tech_devices_1791567729951.jpg',
    },
    {
      id: 'eq-005',
      name: 'Sony FX3 Full-Frame Cinema Line 4K Production Kit',
      category: 'media',
      serialNumber: 'SNY-FX3-IT-0021',
      specs: '4K 120p, 10-bit 4:2:2, XLR Audio Handle Unit, 24-70mm f/2.8 GM Lens, Wireless Mic Kit, Tripod',
      totalQuantity: 2,
      availableQuantity: 2,
      location: 'ห้องบันทึกภาพและเสียง ชั้น 2 (STUDIO-202)',
      imageUrl: '/src/assets/images/it_tech_devices_1791567729951.jpg',
    },
    {
      id: 'eq-006',
      name: 'Fluke DSX2-8000 Versiv CableAnalyzer Pro',
      category: 'network',
      serialNumber: 'FLK-DSX-IT-0077',
      specs: 'Cat 8 / Class I/II Certification Tester, Permanent Link & Channel Adapters, Calibration Valid',
      totalQuantity: 2,
      availableQuantity: 2,
      location: 'ห้องพัสดุและเครือข่าย ชั้น 4 (LAB-402)',
      imageUrl: '/src/assets/images/it_tech_devices_1791567729951.jpg',
    },
  ];

  const bookings: RoomBooking[] = [];
  const equipmentRequests: EquipmentRequest[] = [];
  const auditLogs: SecurityAuditLog[] = [];

  return {
    users,
    rooms,
    equipment,
    bookings,
    equipmentRequests,
    auditLogs,
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
        return JSON.parse(raw);
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
  }

  public resetAllData(): void {
    const initial = getInitialData();
    this.data = initial;
    this.save(initial);
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
}

export const store = new Store();
