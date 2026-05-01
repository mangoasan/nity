const API_URL =
  typeof window === 'undefined'
    ? process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3101/api'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101/api';

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

function normalizeLocalMediaPath(url: string): string {
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return encodeURI(normalizedPath);
}

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) {
    return encodeURI(url);
  }

  const normalizedPath = normalizeLocalMediaPath(url);

  if (normalizedPath.startsWith('/uploads/')) {
    return normalizedPath;
  }

  return normalizedPath;
}

export function isSvgMediaUrl(url?: string | null): boolean {
  return /\.svg(?:\?|#|$)/i.test(resolveMediaUrl(url));
}

export function shouldUnoptimizeMediaUrl(url?: string | null): boolean {
  const resolvedUrl = resolveMediaUrl(url);
  return resolvedUrl.startsWith('/uploads/') || /\.svg(?:\?|#|$)/i.test(resolvedUrl);
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nity_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'Request failed');
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  postForm: <T>(path: string, data: FormData) =>
    request<T>(path, { method: 'POST', body: data }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: User }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, phone?: string) =>
    api.post<{ accessToken: string; user: User }>('/auth/register', { name, email, password, phone }),
  getMe: () => api.get<User>('/auth/me'),
  getMyPasses: () => api.get<PassSummary>('/auth/me/passes'),
  updatePhone: (phone: string) => api.patch<User>('/auth/me/phone', { phone }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ success: boolean }>('/auth/me/change-password', { currentPassword, newPassword }),
};

// Masters
export const mastersApi = {
  getAll: (activeOnly = false) =>
    api.get<Master[]>(`/masters${activeOnly ? '?active=true' : ''}`),
  getOne: (id: string) => api.get<Master>(`/masters/${id}`),
  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.postForm<{ url: string }>('/masters/upload-photo', formData);
  },
  create: (data: Partial<Master>) => api.post<Master>('/masters', data),
  update: (id: string, data: Partial<Master>) => api.put<Master>(`/masters/${id}`, data),
  delete: (id: string) => api.delete(`/masters/${id}`),
};

// Class Types
export const classTypesApi = {
  getAll: (activeOnly = false) =>
    api.get<ClassType[]>(`/class-types${activeOnly ? '?active=true' : ''}`),
  getOne: (id: string) => api.get<ClassType>(`/class-types/${id}`),
  create: (data: Partial<ClassType>) => api.post<ClassType>('/class-types', data),
  update: (id: string, data: Partial<ClassType>) => api.put<ClassType>(`/class-types/${id}`, data),
  delete: (id: string) => api.delete(`/class-types/${id}`),
};

// Schedule
export const scheduleApi = {
  getAll: (activeOnly = false) =>
    api.get<Record<string, ScheduleSlot[]>>(`/schedule${activeOnly ? '?active=true' : ''}`),
  getOne: (id: string) => api.get<ScheduleSlot>(`/schedule/${id}`),
  create: (data: Partial<ScheduleSlot>) => api.post<ScheduleSlot>('/schedule', data),
  update: (id: string, data: Partial<ScheduleSlot>) =>
    api.put<ScheduleSlot>(`/schedule/${id}`, data),
  delete: (id: string) => api.delete(`/schedule/${id}`),
};

// Bookings
export const bookingsApi = {
  book: (scheduleSlotId: string, bookingDate: string) =>
    api.post<Booking>('/bookings', { scheduleSlotId, bookingDate }),
  getMyBookings: () => api.get<Booking[]>('/bookings/my'),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
  getAll: (filters?: BookingFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.slotId) params.set('slotId', filters.slotId);
    if (filters?.date) params.set('date', filters.date);
    if (filters?.weekday) params.set('weekday', filters.weekday);
    if (filters?.classTypeId) params.set('classTypeId', filters.classTypeId);
    if (filters?.masterId) params.set('masterId', filters.masterId);
    if (filters?.userSearch) params.set('userSearch', filters.userSearch);
    const qs = params.toString();
    return api.get<Booking[]>(`/bookings${qs ? `?${qs}` : ''}`);
  },
  updateStatus: (id: string, status: string) =>
    api.put(`/bookings/${id}/status`, { status }),
};

// Personal Training
export const ptApi = {
  submit: (data: PTRequestData) => api.post<PTRequest>('/personal-training', data),
  getAll: (status?: string) =>
    api.get<PTRequest[]>(`/personal-training${status ? `?status=${status}` : ''}`),
  getOne: (id: string) => api.get<PTRequest>(`/personal-training/${id}`),
  updateStatus: (id: string, status: string) =>
    api.put(`/personal-training/${id}/status`, { status }),
};

// Admin
export const adminApi = {
  getDashboard: () =>
    api.get<{
      totalUsers: number;
      totalMasters: number;
      totalBookings: number;
      pendingPTRequests: number;
      confirmedBookings: number;
    }>('/admin/dashboard'),
  getUsers: () => api.get<AdminUser[]>('/admin/users'),
  createUser: (data: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    role?: 'USER' | 'ADMIN';
  }) => api.post<AdminUser>('/admin/users', data),
  grantClassPass: (userId: string, template: ClassPassTemplate, customCount?: number) =>
    api.post<ClassPass>(`/admin/users/${userId}/class-pass`, { template, ...(customCount !== undefined ? { customCount } : {}) }),
};

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string;
  authProvider: string;
}

export interface ActivePassInfo {
  type: 'unlimited' | 'finite';
  template: ClassPassTemplate;
  remainingClasses?: number;
  expiresAt?: string;
}

export interface AdminUser extends User {
  createdAt: string;
  updatedAt: string;
  _count: {
    bookings: number;
    ptRequests: number;
  };
  activePass: ActivePassInfo | null;
}

export interface Master {
  id: string;
  slug: string;
  name: string;
  photoUrl?: string;
  shortBio?: string;
  fullBio?: string;
  specialties: string[];
  isActive: boolean;
}

export interface ClassType {
  id: string;
  titleRu: string;
  titleEn: string;
  titleKk: string;
  descriptionRu?: string;
  descriptionEn?: string;
  descriptionKk?: string;
  durationMinutes: number;
  level: string;
  isActive: boolean;
}

export interface ScheduleSlot {
  id: string;
  masterId: string;
  classTypeId: string;
  weekday: string;
  startTime: string;
  endTime: string;
  capacity: number;
  locationLabel?: string;
  isActive: boolean;
  master?: Master;
  classType?: ClassType;
  _count?: { bookings: number };
}

export interface Booking {
  id: string;
  userId: string;
  scheduleSlotId: string;
  bookingDate: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';
  notes?: string;
  classPassId?: string;
  scheduleSlot?: ScheduleSlot;
}

export type ClassPassTemplate = 'TRIAL' | 'EIGHT' | 'TWELVE' | 'UNLIMITED_MONTH' | 'CUSTOM';

export interface ClassPass {
  id: string;
  userId: string;
  template: ClassPassTemplate;
  totalClasses?: number;
  remainingClasses?: number;
  isUnlimited: boolean;
  startsAt: string;
  expiresAt?: string;
}

export interface PassSummary {
  unlimitedPass: { id: string; expiresAt?: string; template: ClassPassTemplate } | null;
  finitePass: { id: string; remainingClasses: number; template: ClassPassTemplate } | null;
  hasActivePass: boolean;
}

export interface BookingFilters {
  status?: string;
  slotId?: string;
  date?: string;
  weekday?: string;
  classTypeId?: string;
  masterId?: string;
  userSearch?: string;
}

export interface PTRequestData {
  name: string;
  email: string;
  phone?: string;
  preferredTime?: string;
  goal?: string;
  message?: string;
}

export interface PTRequest extends PTRequestData {
  id: string;
  status: 'NEW' | 'CONTACTED' | 'CLOSED';
  userId?: string;
  createdAt: string;
  user?: { name: string; email: string };
}
