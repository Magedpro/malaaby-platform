// ── Type definitions for Malaaby SaaS Platform ──────────────────────────────

export type UserRole = 'super_admin' | 'owner' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  stadiumSlug?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WorkingDayConfig {
  open: boolean;
  from: string; // "08:00"
  to: string;   // "23:00"
}

export type WorkingSchedule = {
  saturday?: WorkingDayConfig;
  sunday?: WorkingDayConfig;
  monday?: WorkingDayConfig;
  tuesday?: WorkingDayConfig;
  wednesday?: WorkingDayConfig;
  thursday?: WorkingDayConfig;
  friday?: WorkingDayConfig;
};

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
}

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended';

export interface Stadium {
  slug: string;
  ownerId: string;
  name: string;
  description?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  city: string;
  address: string;
  googleMapsUrl?: string;
  logo?: string;
  coverImage?: string;
  vodafoneCash?: string;
  instaPay?: string;
  paymentInstructions?: string;
  socialLinks?: SocialLinks;
  workingDays?: WorkingSchedule;
  subscriptionPlanId?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry?: string;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  callmebotApiKey?: string;
  notificationPrefs?: {
    whatsapp: boolean;
    email: boolean;
    browser: boolean;
  };
  notificationEmail?: string;
  pushSubscriptions?: any[];
}

export type FieldStatus = 'available' | 'maintenance' | 'closed';
export type BookingDuration = 30 | 60 | 90 | 120;

export interface Field {
  id: string;
  stadiumSlug: string;
  name: string;
  description?: string;
  pricePerHour: number;
  bookingDuration: BookingDuration;
  coverImage?: string;
  galleryImages?: string[];
  openingTime: string;
  closingTime: string;
  status: FieldStatus;
  workingDays?: WorkingSchedule;
  blockedDates?: string[];
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  fieldId: string;
  stadiumSlug: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  paymentScreenshot?: string;
  status: BookingStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrowserPushSubscription {
  id: string;
  stadiumSlug: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  price: number;
  yearlyPrice: number;
  maxFields: number; // -1 = unlimited
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'new_booking'
  | 'booking_approved'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'subscription_expiry'
  | 'system_announcement';

export interface Notification {
  id: string;
  stadiumSlug: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string;
  isRead: boolean;
  createdAt: string;
}

export type TicketStatus = 'open' | 'pending' | 'closed';

export interface TicketReply {
  id: string;
  message: string;
  authorId: string;
  authorName: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  stadiumSlug: string;
  ownerName: string;
  ownerEmail: string;
  subject: string;
  message: string;
  status: TicketStatus;
  replies: TicketReply[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  targetId?: string;
  targetType?: 'user' | 'stadium' | 'booking' | 'field' | 'subscription' | 'city' | 'settings';
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface City {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface PlatformSettings {
  platformName: string;
  platformNameEn: string;
  logo?: string;
  favicon?: string;
  supportEmail: string;
  supportWhatsApp?: string;
  ownerApprovalRequired: boolean;
  maintenanceMode: boolean;
  termsContent?: string;
  privacyContent?: string;
  socialLinks?: SocialLinks;
  updatedAt: string;
}

export interface Database {
  users: User[];
  stadiums: Stadium[];
  fields: Field[];
  bookings: Booking[];
  subscriptionPlans: SubscriptionPlan[];
  notifications: Notification[];
  supportTickets: SupportTicket[];
  activityLogs: ActivityLog[];
  cities: City[];
  platformSettings: PlatformSettings;
}

// API Response types
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

// Session payload stored in JWT
export interface SessionPayload {
  userId: string;
  role: UserRole;
  stadiumSlug?: string;
  name: string;
  email: string;
}

// Time slot for booking calendar
export interface TimeSlot {
  startTime: string;
  endTime: string;
  status: 'available' | 'pending' | 'booked' | 'closed';
  bookingId?: string;
  amount?: number;
}

// Dashboard stats
export interface OwnerStats {
  todayBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalFields: number;
  totalCustomers: number;
  recentBookings: Booking[];
  monthlyBookingsChart: { month: string; count: number }[];
  monthlyRevenueChart: { month: string; revenue: number }[];
}

export interface AdminStats {
  totalOwners: number;
  activeOwners: number;
  suspendedOwners: number;
  pendingOwners: number;
  totalFields: number;
  totalBookings: number;
  todayBookings: number;
  monthlyBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  growthData: { month: string; owners: number; bookings: number }[];
}
