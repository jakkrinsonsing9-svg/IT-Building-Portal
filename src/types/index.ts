export type UserRole = 'user' | 'admin';
export type UserApprovalStatus = 'pending_verification' | 'pending_approval' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  studentOrStaffId: string;
  citizenId: string;
  phone: string;
  department: string;
  approvalStatus: UserApprovalStatus;
  createdAt: string;
}

export interface UserWithSensitive extends User {
  passwordHash: string;
}

export interface MaskedUserView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  studentOrStaffId: string;
  maskedStudentOrStaffId: string;
  citizenId: string;
  maskedCitizenId: string;
  phone: string;
  maskedPhone: string;
  department: string;
  approvalStatus: UserApprovalStatus;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  floor: number;
  capacity: number;
  type: 'lab' | 'meeting' | 'studio' | 'makerspace' | 'lounge';
  description: string;
  equipment: string[];
  status: 'available' | 'maintenance' | 'occupied';
  imageUrl: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: 'mouse' | 'keyboard' | 'gpu' | 'network' | 'media' | 'hardware' | 'computing' | 'vr_ar' | 'accessories';
  serialNumber: string;
  specs: string;
  totalQuantity: number;
  availableQuantity: number;
  location: string;
  imageUrl: string;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface RoomBooking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string; // May be masked depending on viewer
  userStudentId: string; // May be masked
  userCitizenId?: string; // Masked
  roomId: string;
  roomCode: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  purpose: string;
  attendeesCount: number;
  requestedFacilities: string[];
  advisorName: string;
  status: BookingStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentRequestStatus = 'pending' | 'approved' | 'borrowed' | 'returned' | 'rejected';

export interface EquipmentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string; // May be masked
  userCitizenId: string; // Masked
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  borrowDate: string; // YYYY-MM-DD
  expectedReturnDate: string; // YYYY-MM-DD
  usageLocation: string;
  projectPurpose: string;
  emergencyContact: string;
  status: EquipmentRequestStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  eventType:
    | 'AUTH_LOGIN'
    | 'AUTH_LOGIN_FAILED'
    | 'AUTH_REGISTER'
    | 'ACCESS_DENIED_IDOR'
    | 'BOOKING_CREATE'
    | 'BOOKING_UPDATE'
    | 'BOOKING_DELETE'
    | 'EQUIPMENT_REQUEST_CREATE'
    | 'EQUIPMENT_REQUEST_UPDATE'
    | 'EQUIPMENT_REQUEST_DELETE'
    | 'ADMIN_ACTION'
    | 'SECURITY_SCAN';
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress: string;
  action: string;
  severity: AuditSeverity;
  details?: Record<string, any>;
}

export interface OWASPTestResult {
  id: string;
  owaspCode: string; // e.g. "A01:2021"
  title: string;
  status: 'passed' | 'warning' | 'failed';
  score: number;
  testExecuted: string;
  evidence: string;
  remediationAndStandard: string;
}

export interface OWASPScanReport {
  timestamp: string;
  overallScore: number;
  totalChecks: number;
  passedChecks: number;
  grade: string;
  executionDurationMs: number;
  results: OWASPTestResult[];
}

export type FeedbackTargetType = 'room' | 'equipment' | 'overall';

export interface SatisfactionFeedback {
  id: string;
  targetType: FeedbackTargetType;
  targetId?: string;
  targetName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  rating: number; // 1 to 5
  cleanlinessRating: number; // 1 to 5
  speedRating: number; // 1 to 5
  staffRating: number; // 1 to 5
  comment: string;
  issueReport?: string;
  isAnonymous: boolean;
  helpfulUserIds?: string[];
  createdAt: string;
}

export interface FeedbackSummaryStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [star: number]: number };
  cleanlinessAvg: number;
  speedAvg: number;
  staffAvg: number;
  recommendationRate: number;
}
