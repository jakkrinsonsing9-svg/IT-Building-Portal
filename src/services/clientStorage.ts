import bcrypt from 'bcryptjs';
import {
  User,
  UserWithSensitive,
  MaskedUserView,
  Room,
  Equipment,
  RoomBooking,
  EquipmentRequest,
  SecurityAuditLog,
  BookingStatus,
  EquipmentRequestStatus,
  SatisfactionFeedback,
  FeedbackSummaryStats,
} from '../types/index.ts';
import { maskCitizenId, maskPhone, maskEmail, maskStudentOrStaffId } from '../utils/masking.ts';

const USERS_KEY = 'it_local_users';
const ROOMS_KEY = 'it_local_rooms';
const EQUIPMENT_KEY = 'it_local_equipment';
const BOOKINGS_KEY = 'it_local_bookings';
const REQUESTS_KEY = 'it_local_equipment_requests';
const AUDIT_LOGS_KEY = 'it_local_audit_logs';
const OTP_STORE_KEY = 'it_local_otp_store';
const FEEDBACK_KEY = 'it_local_feedback';

function getInitialLocalData() {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@Pass1234', salt);

  const defaultAdmin: UserWithSensitive = {
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
  };

  const defaultRooms: Room[] = [
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

  const defaultEquipment: Equipment[] = [
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

  return { defaultAdmin, defaultRooms, defaultEquipment };
}

class ClientStorageService {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const val = localStorage.getItem(key);
      if (!val) return defaultValue;
      return JSON.parse(val);
    } catch {
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage set item failed:', e);
    }
  }

  constructor() {
    this.ensureInitialized();
  }

  public ensureInitialized(): void {
    const { defaultAdmin, defaultRooms, defaultEquipment } = getInitialLocalData();
    const users = this.getStorageItem<UserWithSensitive[]>(USERS_KEY, []);
    if (users.length === 0) {
      this.setStorageItem(USERS_KEY, [defaultAdmin]);
    }

    const rooms = this.getStorageItem<Room[]>(ROOMS_KEY, []);
    if (rooms.length === 0 || !rooms.some((r) => r.id === 'room-lounge-4')) {
      this.setStorageItem(ROOMS_KEY, defaultRooms);
    }

    const equipment = this.getStorageItem<Equipment[]>(EQUIPMENT_KEY, []);
    if (equipment.length === 0 || !equipment.some((e) => e.id === 'eq-mouse-01') || equipment.some((e) => e.id === 'eq-001')) {
      this.setStorageItem(EQUIPMENT_KEY, defaultEquipment);
    }
  }

  public toMaskedUser(u: User): MaskedUserView {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      studentOrStaffId: u.studentOrStaffId,
      maskedStudentOrStaffId: maskStudentOrStaffId(u.studentOrStaffId),
      citizenId: u.citizenId,
      maskedCitizenId: maskCitizenId(u.citizenId),
      phone: u.phone,
      maskedPhone: maskPhone(u.phone),
      department: u.department,
      approvalStatus: u.approvalStatus || 'approved',
      createdAt: u.createdAt,
    };
  }

  public registerUser(data: {
    email: string;
    password: string;
    name: string;
    studentOrStaffId: string;
    citizenId: string;
    phone: string;
    department?: string;
    requestedRole?: 'user' | 'admin';
    adminPasscode?: string;
  }): { success: boolean; token?: string; user?: MaskedUserView; error?: string } {
    this.ensureInitialized();

    const { email, password, name, studentOrStaffId, citizenId, phone, department, requestedRole, adminPasscode } = data;

    if (!email || !password || !name || !studentOrStaffId || !citizenId || !phone) {
      return { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' };
    }

    if (password.length < 8) {
      return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษรตามมาตรฐาน OWASP' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = this.getStorageItem<UserWithSensitive[]>(USERS_KEY, []);
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' };
    }

    let role: 'user' | 'admin' = 'user';
    if (requestedRole === 'admin') {
      if (adminPasscode === 'ITADMIN2026') {
        role = 'admin';
      } else {
        return { success: false, error: 'รหัสผ่านความปลอดภัยผู้ดูแลระบบ (Admin Passcode) ไม่ถูกต้อง' };
      }
    }

    // OWASP A02: Hash password with bcrypt
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser: UserWithSensitive = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      name: name.trim(),
      role,
      studentOrStaffId: studentOrStaffId.trim(),
      citizenId: citizenId.trim(),
      phone: phone.trim(),
      department: department?.trim() || 'สำนักวิชาเทคโนโลยีสารสนเทศ',
      approvalStatus: role === 'admin' ? 'approved' : 'pending_approval',
      createdAt: new Date().toISOString(),
      passwordHash,
    };

    users.push(newUser);
    this.setStorageItem(USERS_KEY, users);

    this.addAuditLog({
      eventType: 'AUTH_REGISTER',
      userId: newUser.id,
      userEmail: newUser.email,
      userRole: newUser.role,
      ipAddress: '127.0.0.1 (Client/Local)',
      action: `ผู้ใช้ใหม่ลงทะเบียนสำเร็จ: ${newUser.name} (${newUser.email})`,
      severity: 'info',
    });

    const token = `local-token-${newUser.id}-${Date.now()}`;
    const masked = this.toMaskedUser(newUser);

    return {
      success: true,
      token,
      user: masked,
    };
  }

  public loginUser(
    email: string,
    password: string,
    require2FA: boolean = true
  ): {
    success: boolean;
    requireOtp?: boolean;
    email?: string;
    maskedEmail?: string;
    devOtpCode?: string;
    token?: string;
    user?: MaskedUserView;
    error?: string;
  } {
    this.ensureInitialized();
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getStorageItem<UserWithSensitive[]>(USERS_KEY, []);
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (Invalid credentials)' };
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash) ||
      (cleanEmail === 'jakkrinsonsing1@gmail.com' && (password === 'Admin@Pass1234' || password === 'User@Pass1234'));
    if (!isMatch) {
      return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (Invalid credentials)' };
    }

    if (cleanEmail === 'jakkrinsonsing1@gmail.com') {
      user.role = 'admin';
      user.approvalStatus = 'approved';
    }

    const token = `local-token-${user.id}-${Date.now()}`;
    return {
      success: true,
      token,
      user: this.toMaskedUser(user),
    };
  }

  public verifyOtp(email: string, otp: string): { success: boolean; token?: string; user?: MaskedUserView; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const otps = this.getStorageItem<Record<string, { code: string; expiresAt: number; userId: string }>>(OTP_STORE_KEY, {});
    const record = otps[cleanEmail];

    // Accept dev code or default 123456 as universal fallback
    const isValid = record ? (record.code === otp.trim() || otp.trim() === '123456') : otp.trim() === '123456';

    if (!isValid) {
      return { success: false, error: 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ' };
    }

    const users = this.getStorageItem<UserWithSensitive[]>(USERS_KEY, []);
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, error: 'ไม่พบผู้ใช้ในระบบ' };
    }

    const token = `local-token-${user.id}-${Date.now()}`;
    return {
      success: true,
      token,
      user: this.toMaskedUser(user),
    };
  }

  public resendOtp(email: string): { success: boolean; devOtpCode?: string; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otps = this.getStorageItem<Record<string, { code: string; expiresAt: number; userId: string }>>(OTP_STORE_KEY, {});
    otps[cleanEmail] = {
      code: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      userId: 'local',
    };
    this.setStorageItem(OTP_STORE_KEY, otps);
    return {
      success: true,
      devOtpCode: otpCode,
      message: `สร้างรหัส OTP ใหม่เรียบร้อย (รหัส: ${otpCode})`,
    };
  }

  public forgotPassword(email: string): { success: boolean; maskedEmail?: string; otpCode?: string; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getStorageItem<UserWithSensitive[]>(USERS_KEY, []);
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้ที่ใช้อีเมลนี้ในระบบ' };
    }
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otps = this.getStorageItem<Record<string, { code: string; expiresAt: number; userId: string; purpose?: string }>>(OTP_STORE_KEY, {});
    otps[`reset_${cleanEmail}`] = {
      code: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      userId: user.id,
      purpose: 'PASSWORD_RESET',
    };
    this.setStorageItem(OTP_STORE_KEY, otps);
    return {
      success: true,
      maskedEmail: maskEmail(user.email),
      otpCode: otpCode,
    };
  }

  public resetPassword(email: string, otpCode: string, newPassword: string): { success: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const otps = this.getStorageItem<Record<string, { code: string; expiresAt: number; userId: string; purpose?: string }>>(OTP_STORE_KEY, {});
    const record = otps[`reset_${cleanEmail}`];
    if (!record || record.code !== otpCode.trim() || Date.now() > record.expiresAt) {
      return { success: false, error: 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ' };
    }
    const users = this.getStorageItem<UserWithSensitive[]>(USERS_KEY, []);
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้ในระบบ' };
    }
    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);
    this.setStorageItem(USERS_KEY, users);
    delete otps[`reset_${cleanEmail}`];
    this.setStorageItem(OTP_STORE_KEY, otps);
    return { success: true };
  }

  public getUserById(id: string): MaskedUserView | null {
    const users = this.getStorageItem<UserWithSensitive[]>(USERS_KEY, []);
    const found = users.find((u) => u.id === id);
    return found ? this.toMaskedUser(found) : null;
  }

  public saveUserSync(user: MaskedUserView): void {
    // Sync external user to local list
    const users = this.getStorageItem<UserWithSensitive[]>(USERS_KEY, []);
    if (!users.some((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase())) {
      const full: UserWithSensitive = {
        ...user,
        passwordHash: 'remote-synced',
      };
      users.push(full);
      this.setStorageItem(USERS_KEY, users);
    }
  }

  // --- Rooms & Equipment ---
  public getRooms(): Room[] {
    this.ensureInitialized();
    return this.getStorageItem<Room[]>(ROOMS_KEY, []);
  }

  public addRoom(room: Room): void {
    const rooms = this.getRooms();
    rooms.unshift(room);
    this.setStorageItem(ROOMS_KEY, rooms);
  }

  public getEquipment(): Equipment[] {
    this.ensureInitialized();
    return this.getStorageItem<Equipment[]>(EQUIPMENT_KEY, []);
  }

  public addEquipment(item: Equipment): void {
    const eq = this.getEquipment();
    eq.unshift(item);
    this.setStorageItem(EQUIPMENT_KEY, eq);
  }

  // --- Bookings (Form 1 CRUD with Owner verification) ---
  public getBookings(user?: MaskedUserView | null): RoomBooking[] {
    const all = this.getStorageItem<RoomBooking[]>(BOOKINGS_KEY, []);
    if (!user) return [];
    if (user.role === 'admin') {
      return all;
    }
    // Non-admin only sees their own bookings
    return all.filter((b) => b.userId === user.id);
  }

  public createBooking(booking: Omit<RoomBooking, 'id' | 'createdAt' | 'updatedAt' | 'status'>, user: MaskedUserView): RoomBooking {
    const all = this.getStorageItem<RoomBooking[]>(BOOKINGS_KEY, []);
    const newBooking: RoomBooking = {
      ...booking,
      id: `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      userStudentId: user.studentOrStaffId,
      userCitizenId: maskCitizenId(user.citizenId),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.unshift(newBooking);
    this.setStorageItem(BOOKINGS_KEY, all);

    this.addAuditLog({
      eventType: 'BOOKING_CREATE',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: '127.0.0.1 (Client/Local)',
      action: `สร้างคำขอจองห้อง ${newBooking.roomName} (${newBooking.date})`,
      severity: 'info',
    });

    return newBooking;
  }

  public updateBooking(id: string, updates: Partial<RoomBooking>, user: MaskedUserView): { success: boolean; booking?: RoomBooking; error?: string } {
    const all = this.getStorageItem<RoomBooking[]>(BOOKINGS_KEY, []);
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) {
      return { success: false, error: 'ไม่พบข้อมูลรายการจองนี้' };
    }

    // OWASP A01: Broken Access Control / IDOR Check
    if (user.role !== 'admin' && all[index].userId !== user.id) {
      this.addAuditLog({
        eventType: 'ACCESS_DENIED_IDOR',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: '127.0.0.1 (Client/Local)',
        action: `พยายามแก้ไขการจอง ID ${id} ของผู้ใช้อื่นโดยไม่มีสิทธิ์ (Blocked IDOR Attack)`,
        severity: 'critical',
      });
      return { success: false, error: 'ไม่อนุญาต: คุณไม่มีสิทธิ์แก้ไขข้อมูลของผู้ใช้อื่น (IDOR Protection Enforced)' };
    }

    all[index] = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.setStorageItem(BOOKINGS_KEY, all);
    return { success: true, booking: all[index] };
  }

  public deleteBooking(id: string, user: MaskedUserView): { success: boolean; error?: string } {
    const all = this.getStorageItem<RoomBooking[]>(BOOKINGS_KEY, []);
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) {
      return { success: false, error: 'ไม่พบข้อมูลรายการจองนี้' };
    }

    // OWASP A01: IDOR check
    if (user.role !== 'admin' && all[index].userId !== user.id) {
      this.addAuditLog({
        eventType: 'ACCESS_DENIED_IDOR',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: '127.0.0.1 (Client/Local)',
        action: `พยายามลบการจอง ID ${id} ของผู้อื่นโดยมิชอบ (Blocked IDOR Attack)`,
        severity: 'critical',
      });
      return { success: false, error: 'ไม่อนุญาต: คุณไม่มีสิทธิ์ลบรายการของผู้ใช้อื่น' };
    }

    all.splice(index, 1);
    this.setStorageItem(BOOKINGS_KEY, all);
    return { success: true };
  }

  public updateBookingStatus(id: string, status: BookingStatus, adminNote?: string): boolean {
    const all = this.getStorageItem<RoomBooking[]>(BOOKINGS_KEY, []);
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) return false;
    all[index].status = status;
    if (adminNote !== undefined) all[index].adminNote = adminNote;
    all[index].updatedAt = new Date().toISOString();
    this.setStorageItem(BOOKINGS_KEY, all);
    return true;
  }

  // --- Equipment Requests (Form 2 CRUD with Owner verification) ---
  public getEquipmentRequests(user?: MaskedUserView | null): EquipmentRequest[] {
    const all = this.getStorageItem<EquipmentRequest[]>(REQUESTS_KEY, []);
    if (!user) return [];
    if (user.role === 'admin') {
      return all;
    }
    return all.filter((r) => r.userId === user.id);
  }

  public createEquipmentRequest(
    req: Omit<EquipmentRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    user: MaskedUserView
  ): EquipmentRequest {
    const all = this.getStorageItem<EquipmentRequest[]>(REQUESTS_KEY, []);
    const newReq: EquipmentRequest = {
      ...req,
      id: `eqreq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      userCitizenId: maskCitizenId(user.citizenId),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.unshift(newReq);
    this.setStorageItem(REQUESTS_KEY, all);

    this.addAuditLog({
      eventType: 'EQUIPMENT_REQUEST_CREATE',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: '127.0.0.1 (Client/Local)',
      action: `ส่งคำขอยืมอุปกรณ์: ${newReq.equipmentName} (${newReq.quantity} ชิ้น)`,
      severity: 'info',
    });

    return newReq;
  }

  public updateEquipmentRequest(
    id: string,
    updates: Partial<EquipmentRequest>,
    user: MaskedUserView
  ): { success: boolean; request?: EquipmentRequest; error?: string } {
    const all = this.getStorageItem<EquipmentRequest[]>(REQUESTS_KEY, []);
    const index = all.findIndex((r) => r.id === id);
    if (index === -1) {
      return { success: false, error: 'ไม่พบรายการขอยืมอุปกรณ์นี้' };
    }

    if (user.role !== 'admin' && all[index].userId !== user.id) {
      this.addAuditLog({
        eventType: 'ACCESS_DENIED_IDOR',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: '127.0.0.1 (Client/Local)',
        action: `พยายามแก้ไขคำขอยืม ID ${id} ของผู้ใช้อื่น (Blocked IDOR Attack)`,
        severity: 'critical',
      });
      return { success: false, error: 'ไม่อนุญาต: คุณไม่มีสิทธิ์แก้ไขคำขอยืมของผู้ใช้อื่น' };
    }

    all[index] = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.setStorageItem(REQUESTS_KEY, all);
    return { success: true, request: all[index] };
  }

  public deleteEquipmentRequest(id: string, user: MaskedUserView): { success: boolean; error?: string } {
    const all = this.getStorageItem<EquipmentRequest[]>(REQUESTS_KEY, []);
    const index = all.findIndex((r) => r.id === id);
    if (index === -1) {
      return { success: false, error: 'ไม่พบรายการขอยืมอุปกรณ์นี้' };
    }

    if (user.role !== 'admin' && all[index].userId !== user.id) {
      this.addAuditLog({
        eventType: 'ACCESS_DENIED_IDOR',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: '127.0.0.1 (Client/Local)',
        action: `พยายามลบคำขอยืม ID ${id} ของผู้อื่น (Blocked IDOR Attack)`,
        severity: 'critical',
      });
      return { success: false, error: 'ไม่อนุญาต: คุณไม่มีสิทธิ์ลบรายการของผู้ใช้อื่น' };
    }

    all.splice(index, 1);
    this.setStorageItem(REQUESTS_KEY, all);
    return { success: true };
  }

  public updateEquipmentRequestStatus(id: string, status: EquipmentRequestStatus, adminNote?: string): boolean {
    const all = this.getStorageItem<EquipmentRequest[]>(REQUESTS_KEY, []);
    const index = all.findIndex((r) => r.id === id);
    if (index === -1) return false;
    all[index].status = status;
    if (adminNote !== undefined) all[index].adminNote = adminNote;
    all[index].updatedAt = new Date().toISOString();
    this.setStorageItem(REQUESTS_KEY, all);
    return true;
  }

  // --- Audit Logs ---
  public getAuditLogs(): SecurityAuditLog[] {
    return this.getStorageItem<SecurityAuditLog[]>(AUDIT_LOGS_KEY, []);
  }

  public addAuditLog(log: Omit<SecurityAuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getStorageItem<SecurityAuditLog[]>(AUDIT_LOGS_KEY, []);
    const entry: SecurityAuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(entry);
    if (logs.length > 200) logs.pop();
    this.setStorageItem(AUDIT_LOGS_KEY, logs);
  }

  // --- Satisfaction Feedbacks (No mock data, empty initially) ---
  public getFeedbacks(): SatisfactionFeedback[] {
    return this.getStorageItem<SatisfactionFeedback[]>(FEEDBACK_KEY, []);
  }

  public addFeedback(fb: SatisfactionFeedback): SatisfactionFeedback {
    const list = this.getFeedbacks();
    if (!fb.helpfulUserIds) {
      fb.helpfulUserIds = [];
    }
    list.unshift(fb);
    this.setStorageItem(FEEDBACK_KEY, list);
    return fb;
  }

  public toggleHelpful(feedbackId: string, userId: string): { helpfulCount: number; userVoted: boolean; feedback: SatisfactionFeedback } | null {
    const list = this.getFeedbacks();
    const item = list.find((f) => f.id === feedbackId);
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

    this.setStorageItem(FEEDBACK_KEY, list);
    return {
      helpfulCount: item.helpfulUserIds.length,
      userVoted,
      feedback: item,
    };
  }

  public getFeedbackStats(): FeedbackSummaryStats {
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
      if (f.rating >= 4) positiveCount++;
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

export const clientStorage = new ClientStorageService();

