export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: 'super_admin' | 'admin' | 'moderator' | 'support';
    permissions: string[];
    status: 'active' | 'inactive' | 'suspended' | 'banned';
    lastLogin: Date;
    loginCount: number;
    ipAddress?: string;
    createdAt: Date;
    updatedAt: Date;
    metadata: {
        department?: string;
        accessLevel: number;
        twoFactorEnabled: boolean;
        sessionTimeout: number;
    };
}

export interface AdminStats {
    realTime: {
        activeUsers: number;
        activeSessions: number;
        concurrentCalls: number;
        systemLoad: number;
    };
    userStats: any;
    sessionStats: any;
    aiStats: any;
    revenueStats: any;
    systemStats: any;
    userGrowthData: any[];
    sessionMetrics: any[];
    userDistribution: any[];
    engagementData: any[];
    retentionRates: any;
    topTopics: any[];
}

export interface UserAnalytics {
    userId: string;
    sessions: SessionStats[];
    activity: UserActivity[];
    devices: DeviceInfo[];
    locations: LocationData[];
    learningPatterns: LearningPatterns;
    flags: UserFlag[];
}

export interface SessionStats {
    sessionId: string;
    duration: number;
    participants: number;
    messages: number;
    whiteboardActions: number;
    aiInteractions: number;
    startTime: Date;
    endTime: Date;
    recording?: {
        url: string;
        duration: number;
        size: number;
    };
}

export interface UserActivity {
    timestamp: Date;
    action: string;
    details: any;
    ipAddress: string;
    userAgent: string;
    location?: GeoPoint;
}

export interface DeviceInfo {
    deviceId: string;
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
    lastSeen: Date;
    isCurrent: boolean;
}

export interface LocationData {
    ip: string;
    city: string;
    country: string;
    lastSeen: Date;
}

export interface GeoPoint {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
    region?: string;
}

export interface LearningPatterns {
    preferredTopics: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    activeHours: number[];
    sessionFrequency: number;
    averageDuration: number;
    collaborationScore: number;
}

export interface UserFlag {
    type: 'suspicious' | 'abusive' | 'spam' | 'inactive' | 'premium_candidate';
    severity: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    flaggedAt: Date;
    resolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
}

export interface SystemHealth {
    cpu: {
        usage: number;
        cores: number;
        loadAverage: number[];
    };
    memory: {
        total: number;
        used: number;
        free: number;
        usage: number;
        swapUsed: number;
        swapTotal: number;
    };
    storage: {
        total: number;
        used: number;
        free: number;
        databases: DatabaseStorage[];
    };
    network: {
        inbound: number;
        outbound: number;
        connections: number;
        latency: number;
    };
    services: ServiceStatus[];
}

export interface DatabaseStorage {
    name: string;
    size: number;
    documents: number;
    collections: number;
    growthRate: number;
}

export interface ServiceStatus {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    responseTime: number;
    lastCheck: Date;
    errors: number;
    warnings: number;
}

export interface AuditLog {
    id: string;
    adminId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details: any;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    status: 'success' | 'failure';
    error?: string;
}

export interface ContentModeration {
    id: string;
    sessionId: string;
    userId: string;
    content: {
        type: 'message' | 'whiteboard' | 'voice' | 'file';
        data: any;
    };
    flaggedBy: 'ai' | 'user' | 'admin';
    reason: string;
    severity: 'low' | 'medium' | 'high';
    status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
    action?: {
        type: 'warning' | 'mute' | 'ban' | 'delete';
        duration?: number;
        notes?: string;
    };
    reviewedBy?: string;
    reviewedAt?: Date;
    flaggedAt: Date;
}

export interface AIInsight {
    id: string;
    type: 'trend' | 'anomaly' | 'prediction' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    data: any;
    impact: 'low' | 'medium' | 'high';
    action?: string;
    createdAt: Date;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}

export interface ReportConfig {
    id: string;
    name: string;
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    metrics: string[];
    filters: any;
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv' | 'json';
    schedule: string;
    lastRun?: Date;
    nextRun?: Date;
    enabled: boolean;
}

export interface BillingInfo {
    userId: string;
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    billingEmail: string;
    paymentMethod?: PaymentMethod;
    invoices: Invoice[];
    usage: {
        sessions: number;
        storage: number;
        aiRequests: number;
        collaborators: number;
    };
    limits: {
        maxSessions: number;
        maxStorage: number;
        maxAIRequests: number;
        maxCollaborators: number;
    };
}

export interface PaymentMethod {
    type: 'card' | 'paypal' | 'bank_transfer';
    last4?: string;
    brand?: string;
    expiry?: string;
    country?: string;
}

export interface Invoice {
    id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'unpaid' | 'void';
    paidAt?: Date;
    downloadUrl: string;
    items: InvoiceItem[];
}

export interface InvoiceItem {
    description: string;
    amount: number;
    quantity: number;
}
