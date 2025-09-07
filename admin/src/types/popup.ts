// Popup notification types
export interface PopupAction {
  label: string;
  action: 'close' | 'redirect' | 'custom';
  url?: string;
  customAction?: string;
}

export interface ReminderTime {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface PopupDismissal {
  userId: string;
  dismissedAt: Date;
}

export interface PopupView {
  userId: string;
  viewedAt: Date;
}

export interface Popup {
  _id: string;
  popupId: string;
  title: string;
  message: string;
  type: 'Notice' | 'Event' | 'Payment Reminder' | 'Alert';
  rolesVisibleTo: ('superadmin' | 'admin' | 'staff' | 'dentist' | 'doctor' | 'reception' | 'All')[];
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  startTime: Date;
  endTime?: Date;
  reminderTime?: ReminderTime;
  isActive: boolean;
  displayType: 'Modal' | 'Banner' | 'Toast';
  actions: PopupAction[];
  dismissedBy: PopupDismissal[];
  viewedBy: PopupView[];
  updatedAt: Date;
}

// Form data for creating/editing popups
export interface PopupFormData {
  title: string;
  message: string;
  type: 'Notice' | 'Event' | 'Payment Reminder' | 'Alert';
  rolesVisibleTo: ('superadmin' | 'admin' | 'staff' | 'dentist' | 'doctor' | 'reception' | 'All')[];
  startTime: string; // ISO string
  endTime?: string; // ISO string
  reminderTime?: ReminderTime;
  displayType: 'Modal' | 'Banner' | 'Toast';
  actions: PopupAction[];
}

// API response types
export interface PopupResponse {
  success: boolean;
  message?: string;
  data?: Popup;
  error?: string;
}

export interface PopupsListResponse {
  success: boolean;
  data: Popup[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Analytics types
export interface RoleEngagement {
  views: number;
  dismissals: number;
  total: number;
  viewRate: string;
  dismissalRate: string;
}

export interface PopupAnalytics {
  totalViews: number;
  totalDismissals: number;
  totalInteractions: number;
  viewRate: string;
  dismissalRate: string;
  engagementByRole: Record<string, RoleEngagement>;
  viewedBy: PopupView[];
  dismissedBy: PopupDismissal[];
  createdAt: Date;
  isActive: boolean;
}

export interface PopupStats {
  totalPopups: number;
  activePopups: number;
  inactivePopups: number;
  recentPopups: number;
  popupsByType: Record<string, number>;
}

// Filter types
export interface PopupFilters {
  isActive?: boolean;
  type?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
}

// Store state types
export interface PopupState {
  popups: Popup[];
  activePopups: Popup[];
  currentPopup: Popup | null;
  analytics: PopupAnalytics | null;
  stats: PopupStats | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
}

// Display component props
export interface PopupDisplayProps {
  popup: Popup;
  onView: (popupId: string) => void;
  onDismiss: (popupId: string) => void;
  onActionClick: (action: PopupAction) => void;
}

export interface PopupModalProps extends PopupDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface PopupBannerProps extends PopupDisplayProps {
  position?: 'top' | 'bottom';
}

export interface PopupToastProps extends PopupDisplayProps {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// Form validation types
export interface PopupFormErrors {
  title?: string;
  message?: string;
  startTime?: string;
  endTime?: string;
  rolesVisibleTo?: string;
  reminderTime?: string;
}

// Context types
export interface PopupContextType {
  state: PopupState;
  actions: {
    createPopup: (data: PopupFormData) => Promise<void>;
    updatePopup: (id: string, data: Partial<PopupFormData>) => Promise<void>;
    deletePopup: (id: string) => Promise<void>;
    togglePopupStatus: (id: string) => Promise<void>;
    fetchAllPopups: (filters?: PopupFilters) => Promise<void>;
    fetchActivePopups: () => Promise<void>;
    fetchPopupById: (id: string) => Promise<void>;
    markAsViewed: (id: string) => Promise<void>;
    dismissPopup: (id: string) => Promise<void>;
    fetchAnalytics: (id: string) => Promise<void>;
    fetchStats: () => Promise<void>;
    clearError: () => void;
  };
}