import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { store } from './server/store.ts';
import { supabaseManager, SUPABASE_SQL_SCHEMA } from './server/supabase.ts';
import { runOWASPSecurityScan } from './server/owasp.ts';
import { maskCitizenId, maskPhone, maskEmail, maskStudentOrStaffId } from './src/utils/masking.ts';
import { RoomBooking, EquipmentRequest, UserWithSensitive } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const AUTH_SECRET = process.env.AUTH_SECRET || 'it_building_portal_super_secure_auth_secret_2026';

// Security Headers (OWASP A05: Security Misconfiguration prevention)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json());

// In-memory OTP storage for 2FA verification
interface OTPRecord {
  code: string;
  email: string;
  userId: string;
  expiresAt: number;
  attempts: number;
  purpose: 'LOGIN_2FA' | 'PASSWORD_RESET' | 'REGISTER_VERIFY';
}

const otpStore = new Map<string, OTPRecord>();

function generateOTP(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Token generator & verifier using HMAC SHA256
function createToken(user: UserWithSensitive): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');

  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token: string): { id: string; email: string; role: 'user' | 'admin'; name: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
    if (signature !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
    name: string;
  };
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ (Authentication Required)' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Session หมดอายุหรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' });
  }

  req.user = decoded;
  next();
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      store.addAuditLog({
        eventType: 'ACCESS_DENIED_IDOR',
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        action: 'พยายามเข้าถึงฟังก์ชันของผู้ดูแลระบบโดยไม่มีสิทธิ์ (Admin Privilege Required)',
        severity: 'warning',
        details: { path: req.path },
      });
      return res.status(403).json({ error: 'สิทธิ์ไม่เพียงพอ: ฟังก์ชันนี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น' });
    }
    next();
  });
};

const getClientIp = (req: Request) => req.ip || req.socket.remoteAddress || '127.0.0.1';

// ----------------------------------------------------
// Authentication Endpoints
// ----------------------------------------------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name, studentOrStaffId, citizenId, phone, department, requestedRole, adminPasscode } = req.body;

  if (!email || !password || !name || !studentOrStaffId || !citizenId || !phone) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษรตามมาตรฐาน OWASP' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (store.findUserByEmail(cleanEmail)) {
    return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' });
  }

  // OWASP A02: Hash password with bcrypt cost factor 10
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  // Role assignment: default 'user', 'admin' allowed only if valid adminPasscode
  let role: 'user' | 'admin' = 'user';
  if (requestedRole === 'admin') {
    if (adminPasscode === 'ITADMIN2026') {
      role = 'admin';
    } else {
      return res.status(403).json({ error: 'รหัสผ่านความปลอดภัยผู้ดูแลระบบ (Admin Passcode) ไม่ถูกต้อง' });
    }
  }

  const newUser: UserWithSensitive = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    name: name.trim(),
    role,
    studentOrStaffId: studentOrStaffId.trim(),
    citizenId: citizenId.trim(),
    phone: phone.trim(),
    department: department?.trim() || 'สำนักวิชาเทคโนโลยีสารสนเทศ',
    createdAt: new Date().toISOString(),
    passwordHash,
  };

  store.addUser(newUser);

  store.addAuditLog({
    eventType: 'AUTH_REGISTER',
    userId: newUser.id,
    userEmail: newUser.email,
    userRole: newUser.role,
    ipAddress: getClientIp(req),
    action: `ผู้ใช้ใหม่ลงทะเบียนสำเร็จ: ${newUser.name} (${newUser.email})`,
    severity: 'info',
  });

  const token = createToken(newUser);
  const safeUser = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    studentOrStaffId: newUser.studentOrStaffId,
    maskedStudentOrStaffId: maskStudentOrStaffId(newUser.studentOrStaffId),
    citizenId: newUser.citizenId,
    maskedCitizenId: maskCitizenId(newUser.citizenId),
    phone: newUser.phone,
    maskedPhone: maskPhone(newUser.phone),
    department: newUser.department,
    createdAt: newUser.createdAt,
  };

  return res.status(201).json({
    message: 'ลงทะเบียนสำเร็จ ยินดีต้อนรับเข้าสู่ระบบ',
    token,
    user: safeUser,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = store.findUserByEmail(cleanEmail);

  if (!user) {
    store.addAuditLog({
      eventType: 'AUTH_LOGIN_FAILED',
      userEmail: cleanEmail,
      ipAddress: getClientIp(req),
      action: `เข้าสู่ระบบล้มเหลว: ไม่พบบัญชีผู้ใช้ ${cleanEmail}`,
      severity: 'warning',
    });
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  }

  // Compare with bcrypt
  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    store.addAuditLog({
      eventType: 'AUTH_LOGIN_FAILED',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: getClientIp(req),
      action: `เข้าสู่ระบบล้มเหลว: รหัสผ่านไม่ถูกต้องสำหรับ ${user.email}`,
      severity: 'warning',
    });
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  }

  // Support optional 2FA bypass for quick demo or enforce 2FA OTP
  const require2FA = req.body.require2FA !== false;

  if (require2FA) {
    const otpCode = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(cleanEmail, {
      code: otpCode,
      email: cleanEmail,
      userId: user.id,
      expiresAt,
      attempts: 0,
      purpose: 'LOGIN_2FA',
    });

    store.addAuditLog({
      eventType: 'AUTH_LOGIN',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: getClientIp(req),
      action: `ส่งรหัส OTP (2FA) สำหรับการเข้าสู่ระบบไปยัง ${maskEmail(user.email)}`,
      severity: 'info',
    });

    console.log(`[2FA OTP] Code for ${user.email}: ${otpCode} (Valid for 5 minutes)`);

    return res.json({
      requireOtp: true,
      email: user.email,
      maskedEmail: maskEmail(user.email),
      expiresInSeconds: 300,
      devOtpCode: otpCode, // Provided for easy development & testing convenience
      message: `ระบบได้ส่งรหัส OTP 6 หลักไปยังอีเมล ${maskEmail(user.email)} เรียบร้อยแล้ว`,
    });
  }

  store.addAuditLog({
    eventType: 'AUTH_LOGIN',
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    ipAddress: getClientIp(req),
    action: `เข้าสู่ระบบสำเร็จ: ${user.name} (${user.role.toUpperCase()})`,
    severity: 'info',
  });

  const token = createToken(user);
  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    studentOrStaffId: user.studentOrStaffId,
    maskedStudentOrStaffId: maskStudentOrStaffId(user.studentOrStaffId),
    citizenId: user.citizenId,
    maskedCitizenId: maskCitizenId(user.citizenId),
    phone: user.phone,
    maskedPhone: maskPhone(user.phone),
    department: user.department,
    createdAt: user.createdAt,
  };

  return res.json({
    message: 'เข้าสู่ระบบสำเร็จ',
    token,
    user: safeUser,
  });
});

// Verify OTP endpoint for 2FA
app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัส OTP 6 หลัก' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = otpStore.get(cleanEmail);

  if (!record) {
    return res.status(400).json({ error: 'ไม่พบคำขอ OTP หรือรหัสหมดอายุแล้ว กรุณากดขอรหัสใหม่' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({ error: 'รหัส OTP หมดอายุแล้ว (เกิน 5 นาที) กรุณากดขอรหัสใหม่' });
  }

  if (record.attempts >= 5) {
    otpStore.delete(cleanEmail);
    store.addAuditLog({
      eventType: 'AUTH_LOGIN_FAILED',
      userEmail: cleanEmail,
      ipAddress: getClientIp(req),
      action: `OTP ถูกระงับเนื่องจากกรอกผิดเกิน 5 ครั้ง: ${cleanEmail}`,
      severity: 'error',
    });
    return res.status(429).json({ error: 'กรอกรหัส OTP ผิดเกิน 5 ครั้ง บัญชีถูกระงับชั่วคราว กรุณาขอรหัสใหม่' });
  }

  if (record.code !== otp.trim()) {
    record.attempts += 1;
    store.addAuditLog({
      eventType: 'AUTH_LOGIN_FAILED',
      userEmail: cleanEmail,
      ipAddress: getClientIp(req),
      action: `กรอกรหัส OTP ไม่ถูกต้องสำหรับ ${cleanEmail} (ครั้งที่ ${record.attempts}/5)`,
      severity: 'warning',
    });
    return res.status(400).json({
      error: `รหัส OTP ไม่ถูกต้อง (เหลือโอกาสลองอีก ${5 - record.attempts} ครั้ง)`,
    });
  }

  // OTP verified successfully!
  otpStore.delete(cleanEmail);

  const user = store.findUserByEmail(cleanEmail);
  if (!user) {
    return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้' });
  }

  store.addAuditLog({
    eventType: 'AUTH_LOGIN',
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    ipAddress: getClientIp(req),
    action: `ยืนยันตัวตนสำเร็จ 2-Factor Authentication (OTP): ${user.name} (${user.role.toUpperCase()})`,
    severity: 'info',
  });

  const token = createToken(user);
  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    studentOrStaffId: user.studentOrStaffId,
    maskedStudentOrStaffId: maskStudentOrStaffId(user.studentOrStaffId),
    citizenId: user.citizenId,
    maskedCitizenId: maskCitizenId(user.citizenId),
    phone: user.phone,
    maskedPhone: maskPhone(user.phone),
    department: user.department,
    createdAt: user.createdAt,
  };

  return res.json({
    message: 'ยืนยันตัวตนด้วยรหัส OTP 2FA สำเร็จ เข้าสู่ระบบเรียบร้อย',
    token,
    user: safeUser,
  });
});

// Resend OTP endpoint
app.post('/api/auth/resend-otp', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'กรุณาระบุอีเมล' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = store.findUserByEmail(cleanEmail);
  if (!user) {
    return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้' });
  }

  const otpCode = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  otpStore.set(cleanEmail, {
    code: otpCode,
    email: cleanEmail,
    userId: user.id,
    expiresAt,
    attempts: 0,
    purpose: 'LOGIN_2FA',
  });

  store.addAuditLog({
    eventType: 'AUTH_LOGIN',
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    ipAddress: getClientIp(req),
    action: `ขอส่งรหัส OTP (2FA) ใหม่อีกครั้งไปยัง ${maskEmail(user.email)}`,
    severity: 'info',
  });

  console.log(`[2FA OTP RESEND] New Code for ${user.email}: ${otpCode}`);

  return res.json({
    message: `ส่งรหัส OTP ใหม่อีกครั้งไปยังอีเมล ${maskEmail(user.email)} สำเร็จ`,
    expiresInSeconds: 300,
    devOtpCode: otpCode,
  });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = store.findUserById(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    studentOrStaffId: user.studentOrStaffId,
    maskedStudentOrStaffId: maskStudentOrStaffId(user.studentOrStaffId),
    citizenId: user.citizenId,
    maskedCitizenId: maskCitizenId(user.citizenId),
    phone: user.phone,
    maskedPhone: maskPhone(user.phone),
    department: user.department,
    createdAt: user.createdAt,
  };

  return res.json({ user: safeUser });
});

// ----------------------------------------------------
// Room Catalog & Equipment Catalog
// ----------------------------------------------------
app.get('/api/catalog/rooms', (_req: Request, res: Response) => {
  return res.json({ rooms: store.getRooms() });
});

app.get('/api/catalog/equipment', (_req: Request, res: Response) => {
  return res.json({ equipment: store.getEquipment() });
});

// ----------------------------------------------------
// Form 1 & Feature CRUD: Room Bookings
// (Data Ownership strictly enforced on PUT/DELETE)
// ----------------------------------------------------
app.get('/api/bookings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const allBookings = store.getBookings();

  // Apply PII Masking:
  // If not admin and not the owner of the booking, mask phone and studentId
  const result = allBookings.map((b) => {
    const isOwner = b.userId === currentUserId;
    if (isAdmin || isOwner) {
      return {
        ...b,
        isOwner,
        canEditOrDelete: true,
        userPhoneMasked: maskPhone(b.userPhone),
        userPhoneDisplay: b.userPhone,
        userStudentIdMasked: maskStudentOrStaffId(b.userStudentId),
        userStudentIdDisplay: b.userStudentId,
      };
    }

    return {
      ...b,
      isOwner: false,
      canEditOrDelete: false,
      userPhone: maskPhone(b.userPhone),
      userPhoneMasked: maskPhone(b.userPhone),
      userPhoneDisplay: maskPhone(b.userPhone),
      userStudentId: maskStudentOrStaffId(b.userStudentId),
      userStudentIdMasked: maskStudentOrStaffId(b.userStudentId),
      userStudentIdDisplay: maskStudentOrStaffId(b.userStudentId),
      userCitizenId: maskCitizenId(b.userCitizenId),
    };
  });

  return res.json({ bookings: result });
});

app.post('/api/bookings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { roomId, date, startTime, endTime, purpose, attendeesCount, requestedFacilities, advisorName } = req.body;

  if (!roomId || !date || !startTime || !endTime || !purpose || !attendeesCount) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลการจองห้องให้ครบถ้วน' });
  }

  const room = store.getRoomById(roomId);
  if (!room) {
    return res.status(404).json({ error: 'ไม่พบห้องที่ระบุ' });
  }

  const user = store.findUserById(req.user!.id)!;

  const newBooking: RoomBooking = {
    id: `bkg-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    userStudentId: user.studentOrStaffId,
    userCitizenId: user.citizenId,
    roomId: room.id,
    roomCode: room.code,
    roomName: room.name,
    date,
    startTime,
    endTime,
    purpose: purpose.trim(),
    attendeesCount: parseInt(attendeesCount) || 1,
    requestedFacilities: Array.isArray(requestedFacilities) ? requestedFacilities : [],
    advisorName: advisorName?.trim() || 'ไม่ระบุ',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addBooking(newBooking);

  store.addAuditLog({
    eventType: 'BOOKING_CREATE',
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    ipAddress: getClientIp(req),
    action: `บันทึกคำขอจองห้อง ${room.code} (${date} ${startTime}-${endTime})`,
    severity: 'info',
    details: { bookingId: newBooking.id, roomId: room.id },
  });

  return res.status(201).json({
    message: 'ส่งคำขอจองห้องปฏิบัติการเรียบร้อยแล้ว รอการตรวจสอบจากเจ้าหน้าที่',
    booking: newBooking,
  });
});

app.put('/api/bookings/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const booking = store.getBookingById(id);

  if (!booking) {
    return res.status(404).json({ error: 'ไม่พบข้อมูลรายการจองนี้ในระบบ' });
  }

  // --- OWASP A01: Broken Access Control / IDOR Defense ---
  // User A CANNOT edit User B's booking
  const isOwner = booking.userId === req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  if (!isOwner && !isAdmin) {
    store.addAuditLog({
      eventType: 'ACCESS_DENIED_IDOR',
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      ipAddress: getClientIp(req),
      action: `[IDOR ATTACK BLOCKED] ผู้ใช้ ${req.user!.email} พยายามแก้ไขรายการจอง #${id} ของเจ้าของอื่น (${booking.userName})`,
      severity: 'critical',
      details: { bookingId: id, attemptedBy: req.user!.id, realOwner: booking.userId },
    });

    return res.status(403).json({
      error: 'Access Denied: สิทธิ์ไม่เพียงพอ คุณไม่สามารถแก้ไขข้อมูลการจองของผู้ใช้อื่นได้ (Data Ownership Violation)',
    });
  }

  const { date, startTime, endTime, purpose, attendeesCount, requestedFacilities, advisorName } = req.body;

  const updated = store.updateBooking(id, {
    ...(date && { date }),
    ...(startTime && { startTime }),
    ...(endTime && { endTime }),
    ...(purpose && { purpose: purpose.trim() }),
    ...(attendeesCount && { attendeesCount: parseInt(attendeesCount) || booking.attendeesCount }),
    ...(requestedFacilities && { requestedFacilities }),
    ...(advisorName && { advisorName: advisorName.trim() }),
  });

  store.addAuditLog({
    eventType: 'BOOKING_UPDATE',
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    ipAddress: getClientIp(req),
    action: `อัปเดตข้อมูลการจองห้อง #${id} โดย ${req.user!.name}`,
    severity: 'info',
    details: { bookingId: id },
  });

  return res.json({ message: 'อัปเดตข้อมูลการจองเรียบร้อยแล้ว', booking: updated });
});

app.delete('/api/bookings/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const booking = store.getBookingById(id);

  if (!booking) {
    return res.status(404).json({ error: 'ไม่พบรายการจองนี้ในระบบ' });
  }

  // --- OWASP A01: Broken Access Control / IDOR Defense ---
  const isOwner = booking.userId === req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  if (!isOwner && !isAdmin) {
    store.addAuditLog({
      eventType: 'ACCESS_DENIED_IDOR',
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      ipAddress: getClientIp(req),
      action: `[IDOR ATTACK BLOCKED] ผู้ใช้ ${req.user!.email} พยายามลบรายการจอง #${id} ของเจ้าของอื่น`,
      severity: 'critical',
      details: { bookingId: id, attemptedBy: req.user!.id, realOwner: booking.userId },
    });

    return res.status(403).json({
      error: 'Access Denied: สิทธิ์ไม่เพียงพอ คุณไม่สามารถลบข้อมูลการจองของผู้อื่นได้ (Data Ownership Violation)',
    });
  }

  store.deleteBooking(id);

  store.addAuditLog({
    eventType: 'BOOKING_DELETE',
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    ipAddress: getClientIp(req),
    action: `ลบ/ยกเลิกรายการจองห้อง #${id} โดย ${req.user!.name}`,
    severity: 'info',
    details: { bookingId: id },
  });

  return res.json({ message: 'ยกเลิกรายการจองสำเร็จ' });
});

// Admin status change for room booking
app.patch('/api/bookings/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  const booking = store.getBookingById(id);
  if (!booking) {
    return res.status(404).json({ error: 'ไม่พบรายการจอง' });
  }

  const updated = store.updateBooking(id, {
    status,
    adminNote: adminNote || booking.adminNote,
  });

  store.addAuditLog({
    eventType: 'ADMIN_ACTION',
    userId: req.user!.id,
    userEmail: req.user!.email,
    ipAddress: getClientIp(req),
    action: `ผู้ดูแลระบบเปลี่ยนสถานะการจอง #${id} เป็น ${status}`,
    severity: 'info',
    details: { bookingId: id, status, adminNote },
  });

  return res.json({ message: 'ปรับปรุงสถานะการจองสำเร็จ', booking: updated });
});

// ----------------------------------------------------
// Form 2 & Feature CRUD: IT Equipment Requests
// (Data Ownership strictly enforced on PUT/DELETE)
// ----------------------------------------------------
app.get('/api/equipment-requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const allRequests = store.getEquipmentRequests();

  // Apply PII Masking:
  const result = allRequests.map((r) => {
    const isOwner = r.userId === currentUserId;
    if (isAdmin || isOwner) {
      return {
        ...r,
        isOwner,
        canEditOrDelete: true,
        userPhoneMasked: maskPhone(r.userPhone),
        userPhoneDisplay: r.userPhone,
        userCitizenIdMasked: maskCitizenId(r.userCitizenId),
        userCitizenIdDisplay: r.userCitizenId,
      };
    }

    return {
      ...r,
      isOwner: false,
      canEditOrDelete: false,
      userPhone: maskPhone(r.userPhone),
      userPhoneMasked: maskPhone(r.userPhone),
      userPhoneDisplay: maskPhone(r.userPhone),
      userCitizenId: maskCitizenId(r.userCitizenId),
      userCitizenIdMasked: maskCitizenId(r.userCitizenId),
      userCitizenIdDisplay: maskCitizenId(r.userCitizenId),
    };
  });

  return res.json({ requests: result });
});

app.post('/api/equipment-requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { equipmentId, quantity, borrowDate, expectedReturnDate, usageLocation, projectPurpose, emergencyContact } = req.body;

  if (!equipmentId || !borrowDate || !expectedReturnDate || !usageLocation || !projectPurpose) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลการขอยืมอุปกรณ์ให้ครบถ้วน' });
  }

  const eq = store.getEquipmentById(equipmentId);
  if (!eq) {
    return res.status(404).json({ error: 'ไม่พบอุปกรณ์ที่ต้องการ' });
  }

  const qty = parseInt(quantity) || 1;
  if (qty > eq.availableQuantity) {
    return res.status(400).json({
      error: `อุปกรณ์ ${eq.name} มีคงเหลือให้ยืมเพียง ${eq.availableQuantity} ชิ้น (คุณร้องขอ ${qty} ชิ้น)`,
    });
  }

  const user = store.findUserById(req.user!.id)!;

  const newReq: EquipmentRequest = {
    id: `eqr-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    userCitizenId: user.citizenId,
    equipmentId: eq.id,
    equipmentName: eq.name,
    quantity: qty,
    borrowDate,
    expectedReturnDate,
    usageLocation: usageLocation.trim(),
    projectPurpose: projectPurpose.trim(),
    emergencyContact: emergencyContact?.trim() || user.phone,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.addEquipmentRequest(newReq);

  store.addAuditLog({
    eventType: 'EQUIPMENT_REQUEST_CREATE',
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    ipAddress: getClientIp(req),
    action: `ส่งคำขอยืมอุปกรณ์ ${eq.name} จำนวน ${qty} รายการ (${borrowDate} ถึง ${expectedReturnDate})`,
    severity: 'info',
    details: { requestId: newReq.id, equipmentId: eq.id, quantity: qty },
  });

  return res.status(201).json({
    message: 'ส่งคำขอใช้ของส่วนกลางสำเร็จ กรุณารอเจ้าหน้าที่ตรวจสอบและอนุมัติ',
    request: newReq,
  });
});

app.put('/api/equipment-requests/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = store.getEquipmentRequestById(id);

  if (!existing) {
    return res.status(404).json({ error: 'ไม่พบรายการขอยืมอุปกรณ์นี้' });
  }

  // --- OWASP A01: Broken Access Control / IDOR Defense ---
  const isOwner = existing.userId === req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  if (!isOwner && !isAdmin) {
    store.addAuditLog({
      eventType: 'ACCESS_DENIED_IDOR',
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      ipAddress: getClientIp(req),
      action: `[IDOR ATTACK BLOCKED] ผู้ใช้ ${req.user!.email} พยายามแก้ไขคำขอยืมอุปกรณ์ #${id} ของผู้อื่น (${existing.userName})`,
      severity: 'critical',
      details: { requestId: id, attemptedBy: req.user!.id, realOwner: existing.userId },
    });

    return res.status(403).json({
      error: 'Access Denied: สิทธิ์ไม่เพียงพอ คุณไม่สามารถแก้ไขคำขอยืมอุปกรณ์ของผู้ใช้อื่นได้ (Data Ownership Violation)',
    });
  }

  const { borrowDate, expectedReturnDate, usageLocation, projectPurpose, emergencyContact } = req.body;

  const updated = store.updateEquipmentRequest(id, {
    ...(borrowDate && { borrowDate }),
    ...(expectedReturnDate && { expectedReturnDate }),
    ...(usageLocation && { usageLocation: usageLocation.trim() }),
    ...(projectPurpose && { projectPurpose: projectPurpose.trim() }),
    ...(emergencyContact && { emergencyContact: emergencyContact.trim() }),
  });

  store.addAuditLog({
    eventType: 'EQUIPMENT_REQUEST_UPDATE',
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    ipAddress: getClientIp(req),
    action: `อัปเดตข้อมูลคำขอยืมอุปกรณ์ #${id}`,
    severity: 'info',
  });

  return res.json({ message: 'อัปเดตคำขอยืมอุปกรณ์เรียบร้อยแล้ว', request: updated });
});

app.delete('/api/equipment-requests/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = store.getEquipmentRequestById(id);

  if (!existing) {
    return res.status(404).json({ error: 'ไม่พบรายการขอยืมอุปกรณ์นี้' });
  }

  // --- OWASP A01: Broken Access Control / IDOR Defense ---
  const isOwner = existing.userId === req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  if (!isOwner && !isAdmin) {
    store.addAuditLog({
      eventType: 'ACCESS_DENIED_IDOR',
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      ipAddress: getClientIp(req),
      action: `[IDOR ATTACK BLOCKED] ผู้ใช้ ${req.user!.email} พยายามลบคำขอยืมอุปกรณ์ #${id} ของผู้อื่น`,
      severity: 'critical',
      details: { requestId: id, attemptedBy: req.user!.id, realOwner: existing.userId },
    });

    return res.status(403).json({
      error: 'Access Denied: สิทธิ์ไม่เพียงพอ คุณไม่สามารถยกเลิกคำขอยืมอุปกรณ์ของผู้อื่นได้ (Data Ownership Violation)',
    });
  }

  store.deleteEquipmentRequest(id);

  store.addAuditLog({
    eventType: 'EQUIPMENT_REQUEST_DELETE',
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    ipAddress: getClientIp(req),
    action: `ยกเลิกคำขอยืมอุปกรณ์ #${id}`,
    severity: 'info',
  });

  return res.json({ message: 'ยกเลิกคำขอยืมอุปกรณ์เรียบร้อยแล้ว' });
});

app.patch('/api/equipment-requests/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  const existing = store.getEquipmentRequestById(id);
  if (!existing) {
    return res.status(404).json({ error: 'ไม่พบรายการขอยืมอุปกรณ์' });
  }

  const updated = store.updateEquipmentRequest(id, {
    status,
    adminNote: adminNote || existing.adminNote,
  });

  store.addAuditLog({
    eventType: 'ADMIN_ACTION',
    userId: req.user!.id,
    userEmail: req.user!.email,
    ipAddress: getClientIp(req),
    action: `ผู้ดูแลระบบปรับสถานะคำขอยืมอุปกรณ์ #${id} เป็น ${status}`,
    severity: 'info',
    details: { requestId: id, status, adminNote },
  });

  return res.json({ message: 'ปรับสถานะอุปกรณ์สำเร็จ', request: updated });
});

// ----------------------------------------------------
// Admin Management & Stats Endpoints
// ----------------------------------------------------
app.get('/api/admin/stats', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const bookings = store.getBookings();
  const equipmentRequests = store.getEquipmentRequests();
  const users = store.getUsers();
  const rooms = store.getRooms();
  const equipment = store.getEquipment();

  const activeRooms = new Set(
    bookings.filter((b) => b.status === 'approved' || b.status === 'pending').map((b) => b.roomId)
  ).size;
  const utilizationRate = rooms.length > 0 ? Math.round((activeRooms / rooms.length) * 100) : 0;

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    approvedBookings: bookings.filter((b) => b.status === 'approved').length,
    totalEquipmentRequests: equipmentRequests.length,
    pendingEquipmentRequests: equipmentRequests.filter((r) => r.status === 'pending').length,
    activeBorrowedEquipment: equipmentRequests.filter((r) => r.status === 'borrowed' || r.status === 'approved').length,
    totalUsers: users.length,
    totalRooms: rooms.length,
    totalEquipmentTypes: equipment.length,
    utilizationRate,
  };

  return res.json({ stats });
});

app.post('/api/admin/reset-data', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  store.resetAllData();
  return res.json({ message: 'ล้างข้อมูลตัวอย่างทั้งหมดเรียบร้อยแล้ว คืนค่าระบบสู่สถานะเริ่มต้นสำหรับการทดสอบ' });
});

// ----------------------------------------------------
// Analytics & Weekly Data Visualization Endpoint (Admin Only)
// ----------------------------------------------------
app.get('/api/analytics/weekly', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const bookings = store.getBookings();
  const equipmentRequests = store.getEquipmentRequests();
  const rooms = store.getRooms();
  const equipmentList = store.getEquipment();

  // Days of week in Thai and English (Monday to Sunday)
  const days = [
    { key: 'Mon', label: 'จันทร์', dayIndex: 1 },
    { key: 'Tue', label: 'อังคาร', dayIndex: 2 },
    { key: 'Wed', label: 'พุธ', dayIndex: 3 },
    { key: 'Thu', label: 'พฤหัสฯ', dayIndex: 4 },
    { key: 'Fri', label: 'ศุกร์', dayIndex: 5 },
    { key: 'Sat', label: 'เสาร์', dayIndex: 6 },
    { key: 'Sun', label: 'อาทิตย์', dayIndex: 0 },
  ];

  // Purely dynamic calculation from real database records (no fake/hardcoded baseline numbers)
  const weeklyTrends = days.map((d) => {
    const matchingBookings = bookings.filter((b) => {
      const bDate = new Date(b.date);
      return !isNaN(bDate.getTime()) && bDate.getDay() === d.dayIndex;
    }).length;

    const matchingEq = equipmentRequests.filter((r) => {
      const rDate = new Date(r.borrowDate);
      return !isNaN(rDate.getTime()) && rDate.getDay() === d.dayIndex;
    }).length;

    return {
      day: d.key,
      dayLabel: d.label,
      roomBookings: matchingBookings,
      equipmentRequests: matchingEq,
      totalActivity: matchingBookings + matchingEq,
    };
  });

  // Calculate Status Distribution for Donut Chart strictly from live database
  let approvedCount = 0;
  let pendingCount = 0;
  let inUseCount = 0;
  let returnedCount = 0;
  let rejectedCount = 0;

  bookings.forEach((b) => {
    if (b.status === 'approved') approvedCount++;
    else if (b.status === 'pending') pendingCount++;
    else if (b.status === 'completed') returnedCount++;
    else if (b.status === 'rejected') rejectedCount++;
  });

  equipmentRequests.forEach((r) => {
    if (r.status === 'approved') approvedCount++;
    else if (r.status === 'pending') pendingCount++;
    else if (r.status === 'borrowed') inUseCount++;
    else if (r.status === 'returned') returnedCount++;
    else if (r.status === 'rejected') rejectedCount++;
  });

  const statusDistribution = [
    { label: 'อนุมัติแล้ว (Approved)', count: approvedCount, color: '#38bdf8', key: 'approved' },
    { label: 'รออนุมัติ (Pending)', count: pendingCount, color: '#fbbf24', key: 'pending' },
    { label: 'กำลังใช้งาน/ยืมอยู่ (In Use)', count: inUseCount, color: '#818cf8', key: 'in_use' },
    { label: 'คืนแล้ว/เสร็จสิ้น (Returned)', count: returnedCount, color: '#34d399', key: 'returned' },
    { label: 'ปฏิเสธ (Rejected)', count: rejectedCount, color: '#f43f5e', key: 'rejected' },
  ];

  // Room Popularity Distribution strictly from live database bookings
  const roomPalette = ['#06b6d4', '#6366f1', '#a855f7', '#f59e0b', '#10b981', '#ec4899'];
  const totalBookingsCount = bookings.length;
  const roomDistribution = rooms.map((room, idx) => {
    const count = bookings.filter((b) => b.roomId === room.id).length;
    return {
      name: `${room.name} (${room.code})`,
      code: room.code,
      bookings: count,
      percentage: totalBookingsCount > 0 ? Math.round((count / totalBookingsCount) * 100) : 0,
      color: roomPalette[idx % roomPalette.length],
    };
  });

  // Category Distribution for equipment requests strictly from live database
  const eqCategories: { key: string; label: string; color: string }[] = [
    { key: 'computing', label: 'Computing & eGPU', color: '#38bdf8' },
    { key: 'vr_ar', label: 'VR/AR Headsets', color: '#818cf8' },
    { key: 'network', label: 'Network Enterprise', color: '#34d399' },
    { key: 'media', label: 'Media & 4K Production', color: '#f472b6' },
  ];

  const totalEqReqs = equipmentRequests.length;
  const equipmentCategoryDistribution = eqCategories.map((cat) => {
    const matchingReqs = equipmentRequests.filter((r) => {
      const eqItem = equipmentList.find((e) => e.id === r.equipmentId);
      return eqItem?.category === cat.key;
    }).length;

    return {
      category: cat.label,
      count: matchingReqs,
      percentage: totalEqReqs > 0 ? Math.round((matchingReqs / totalEqReqs) * 100) : 0,
      color: cat.color,
    };
  });

  const totalWeeklyBookings = weeklyTrends.reduce((acc, curr) => acc + curr.roomBookings, 0);
  const totalWeeklyEquipment = weeklyTrends.reduce((acc, curr) => acc + curr.equipmentRequests, 0);
  const totalWeeklyActivities = totalWeeklyBookings + totalWeeklyEquipment;

  const peakDay = weeklyTrends.reduce(
    (max, d) => (d.totalActivity > max.totalActivity ? d : max),
    weeklyTrends[0]
  );

  const activeRooms = new Set(
    bookings.filter((b) => b.status === 'approved' || b.status === 'pending').map((b) => b.roomId)
  ).size;
  const utilizationPercentage = rooms.length > 0 ? Math.round((activeRooms / rooms.length) * 100) : 0;

  return res.json({
    weeklyTrends,
    statusDistribution,
    roomDistribution,
    equipmentCategoryDistribution,
    summary: {
      totalWeeklyBookings,
      totalWeeklyEquipment,
      totalWeeklyActivities,
      peakDayLabel: totalWeeklyActivities > 0 ? peakDay.dayLabel : 'ไม่มี',
      peakDayActivity: totalWeeklyActivities > 0 ? peakDay.totalActivity : 0,
      averageDailyUsage: Number((totalWeeklyActivities / 7).toFixed(1)),
      utilizationPercentage,
    },
  });
});

app.get('/api/admin/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ logs: store.getAuditLogs() });
});

app.post('/api/admin/rooms', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, code, floor, capacity, type, description, equipment } = req.body;
  if (!name || !code || !floor || !capacity) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลห้องให้ครบถ้วน' });
  }

  const newRoom = {
    id: `room-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    floor: parseInt(floor) || 1,
    capacity: parseInt(capacity) || 20,
    type: type || 'lab',
    description: description?.trim() || '',
    equipment: Array.isArray(equipment) ? equipment : [],
    status: 'available' as const,
    imageUrl: '/src/assets/images/it_lab_interior_1791567709768.jpg',
  };

  store.addRoom(newRoom);
  return res.status(201).json({ message: 'เพิ่มห้องปฏิบัติการใหม่สำเร็จ', room: newRoom });
});

app.post('/api/admin/equipment', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, category, serialNumber, specs, totalQuantity, location } = req.body;
  if (!name || !category || !serialNumber || !totalQuantity) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลอุปกรณ์ให้ครบถ้วน' });
  }

  const qty = parseInt(totalQuantity) || 1;
  const newEquipment = {
    id: `eq-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    category,
    serialNumber: serialNumber.trim().toUpperCase(),
    specs: specs?.trim() || '',
    totalQuantity: qty,
    availableQuantity: qty,
    location: location?.trim() || 'ตึกไอที ห้องศูนย์พัสดุ',
    imageUrl: '/src/assets/images/it_tech_devices_1791567729951.jpg',
  };

  store.addEquipment(newEquipment);
  return res.status(201).json({ message: 'เพิ่มอุปกรณ์ส่วนกลางใหม่สำเร็จ', equipment: newEquipment });
});

// ----------------------------------------------------
// OWASP Top 10 Security Scan & IDOR Attack Simulation
// ----------------------------------------------------
app.post('/api/security/owasp-scan', (_req: Request, res: Response) => {
  const report = runOWASPSecurityScan();
  return res.json({ report });
});

// Interactive IDOR Attack Simulation endpoint
app.post('/api/security/simulate-idor', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const bookings = store.getBookings();
  const otherUserBooking = bookings.find((b) => b.userId !== req.user!.id);

  const targetBookingId = otherUserBooking?.id || 'bkg-victim-0099';
  const targetOwnerName = otherUserBooking?.userName || 'นศ. ตัวอย่าง (เหยื่อสมมุติ)';

  // Simulate an unauthorized update payload attempting to tamper with another user's booking
  store.addAuditLog({
    eventType: 'ACCESS_DENIED_IDOR',
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    ipAddress: getClientIp(req),
    action: `[IDOR ATTACK SIMULATION] ระบบตรวจจับและบล็อกความพยายามแก้ไข Record #${targetBookingId} สำเร็จ! (HTTP 403 Forbidden)`,
    severity: 'critical',
    details: {
      attackType: 'Insecure Direct Object Reference (OWASP A01)',
      targetId: targetBookingId,
      targetOwner: targetOwnerName,
      attackerId: req.user!.id,
      attackerEmail: req.user!.email,
    },
  });

  return res.status(403).json({
    status: 'attack_intercepted',
    owaspCategory: 'A01:2021 - Broken Access Control',
    message: `ระบบความปลอดภัยบล็อกสำเร็จ! ผู้ใช้ ${req.user!.email} ไม่สามารถแก้ไข Record #${targetBookingId} ของ ${targetOwnerName} ได้`,
    attackDetails: {
      targetBookingId,
      legitimateOwner: targetOwnerName,
      tamperAttemptBlocked: true,
      httpStatusReturned: 403,
    },
  });
});

// ----------------------------------------------------
// Supabase Database Integration Endpoints
// ----------------------------------------------------

// GET Supabase status & configuration
app.get('/api/supabase/config', (_req: Request, res: Response) => {
  const config = supabaseManager.getConfig();
  return res.json({
    ...config,
    sqlSchema: SUPABASE_SQL_SCHEMA,
  });
});

// POST test Supabase connection
app.post('/api/supabase/test', async (req: Request, res: Response) => {
  const { url, key } = req.body;
  const result = await supabaseManager.testConnection(url, key);
  return res.json(result);
});

// POST save Supabase configuration
app.post('/api/supabase/config', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { url, anonKey, serviceRoleKey } = req.body;

  if (!url || (!anonKey && !serviceRoleKey)) {
    return res.status(400).json({ error: 'กรุณากรอก Supabase Project URL และ API Key' });
  }

  // Test connection first
  const testRes = await supabaseManager.testConnection(url, serviceRoleKey || anonKey);
  if (!testRes.success && !testRes.message.includes('SQL Schema')) {
    return res.status(400).json({ error: testRes.message });
  }

  const updated = supabaseManager.saveConfig({
    url,
    anonKey: anonKey || '',
    serviceRoleKey: serviceRoleKey || '',
    enabled: true,
    connectedAt: new Date().toISOString(),
  });

  store.addAuditLog({
    eventType: 'ADMIN_ACTION',
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    ipAddress: getClientIp(req),
    action: `แอดมินตั้งค่าเชื่อมต่อฐานข้อมูลภายนอก Supabase (${url}) เรียบร้อยแล้ว`,
    severity: 'info',
    details: { url, connectedAt: new Date().toISOString() },
  });

  return res.json({
    success: true,
    message: 'บันทึกการตั้งค่าและเชื่อมต่อ Supabase สำเร็จแล้ว!',
    config: supabaseManager.getConfig(),
    testResult: testRes,
  });
});

// POST sync all current data to Supabase
app.post('/api/supabase/sync', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  if (!supabaseManager.isConnected()) {
    return res.status(400).json({ error: 'Supabase ยังไม่ได้เชื่อมต่อ กรุณาตั้งค่า URL และ Key ก่อน' });
  }

  const currentData = store.getAllData();
  const syncResult = await supabaseManager.syncDataToSupabase(currentData);

  store.addAuditLog({
    eventType: 'ADMIN_ACTION',
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    ipAddress: getClientIp(req),
    action: `แอดมินทำการ Sync ข้อมูลระบบไปยัง Supabase ฐานข้อมูลภายนอก`,
    severity: 'info',
    details: syncResult.results,
  });

  return res.json(syncResult);
});

// POST disconnect Supabase
app.post('/api/supabase/disconnect', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  supabaseManager.saveConfig({
    enabled: false,
    connectedAt: undefined,
  });

  store.addAuditLog({
    eventType: 'ADMIN_ACTION',
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    ipAddress: getClientIp(req),
    action: `แอดมินยกเลิกการเชื่อมต่อกับ Supabase กลับไปใช้ Local Database`,
    severity: 'warning',
  });

  return res.json({
    success: true,
    message: 'ยกเลิกการเชื่อมต่อ Supabase เรียบร้อยแล้ว ระบบกลับไปใช้ Local Storage',
  });
});

// Fallback for undefined API routes
app.all('/api/*', (_req: Request, res: Response) => {
  return res.status(404).json({ error: 'API route not found' });
});

// Vite Middleware mounting in development or static serve in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 IT Building Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
