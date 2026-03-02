export const SETTINGS_COLORS = {
  success: '#00C853',
  warning: '#FFB300',
  error: '#FF1744',
  info: '#2979FF',
  active: '#76FF03',
  inactive: '#757575',
  critical: '#D500F9',
} as const;

export interface SystemSettings {
  general: {
    platformName: string;
    organization: string;
    supportEmail: string;
    supportPhone: string;
    platformUrl: string;
    logoUrl: string;
    faviconUrl: string;
    currency: 'INR' | 'USD' | 'EUR' | 'GBP';
    currencyDisplay: 'indian' | 'international';
    timezone: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
    decimalPlaces: number;
    financialYearStart: 'January' | 'April' | 'July' | 'October';
    availability24x7: boolean;
    businessHours: {
      start: string;
      end: string;
      days: string[];
    };
    maintenance: {
      enabled: boolean;
      startAt: string;
      durationHours: number;
      notifyBeforeHours: number;
    };
  };
  auctionDefaults: {
    defaultAuctionType: 'REVERSE' | 'SPOT' | 'LOT' | 'BULK' | 'REGION_LOT';
    decrementINR: number;
    extensionThresholdSec: number;
    extensionDurationSec: number;
    maxExtensions: number;
    laneDurationSec: number;
    minVendors: number;
    autoInviteEligibleVendors: boolean;
    vendorRegistration: 'open' | 'approval_required' | 'invite_only';
    anonymousBidding: boolean;
    rankDisplay: boolean;
    winnerTimeoutHours: number;
    autoAwardRunnerUp: boolean;
    acceptanceThresholdPct: number;
    contractAutoGeneration: boolean;
    eSignatureRequired: boolean;
    bidRateLimitEnabled: boolean;
    maxBidsPerMinute: number;
    analyticsCacheMinutes: number;
    autoArchiveEnabled: boolean;
    autoArchiveDays: number;
  };
  notifications: {
    email: {
      service: 'SMTP' | 'SendGrid' | 'AWS SES' | 'Mailgun';
      fromName: string;
      fromEmail: string;
      replyToEmail: string;
      events: Record<string, boolean>;
    };
    sms: {
      service: 'Twilio' | 'AWS SNS' | 'MSG91' | 'Fast2SMS';
      creditsRemaining: number;
      lowCreditsAlert: number;
      events: Record<string, boolean>;
    };
    inApp: {
      pushEnabled: boolean;
      soundEnabled: boolean;
      soundFile: string;
      badgeCountEnabled: boolean;
      autoDismissSec: number;
    };
    whatsapp: {
      configured: boolean;
      status: 'not_configured' | 'pending_approval' | 'connected';
    };
  };
  emailTemplates: {
    templates: Array<{
      id: string;
      category: 'vendor' | 'admin' | 'client' | 'system';
      name: string;
      subject: string;
      body: string;
      active: boolean;
      sentCount30d: number;
      openRate: number;
      lastModifiedAt: number;
    }>;
  };
  paymentGateway: {
    primary: 'Razorpay' | 'Paytm' | 'CCAvenue' | 'PayU' | 'Stripe' | 'PayPal';
    separateVendorGateway: boolean;
    vendorGateway: 'Razorpay' | 'Paytm' | 'CCAvenue' | 'PayU' | 'Stripe' | 'PayPal';
    connectionStatus: 'connected' | 'not_configured';
    apiKeyMasked: string;
    apiSecretMasked: string;
    webhookSecretMasked: string;
    testMode: boolean;
    emdEnabled: boolean;
    emdType: 'fixed' | 'percentage' | 'per_lane';
    emdValue: number;
    refundNonWinners: boolean;
    refundTimelineDays: number;
    autoRefund: boolean;
    paymentMethods: Record<string, boolean>;
    transactionFeeBorneBy: 'platform' | 'vendor' | 'split';
    threeDSecureMandatory: boolean;
    autoCapture: boolean;
    paymentLogsRetentionMonths: number;
    autoReconciliation: boolean;
    reconciliationTime: string;
    discrepancyAlert: boolean;
    discrepancyAlertEmail: string;
  };
  integrations: {
    erp: {
      connected: boolean;
      system: 'SAP' | 'Oracle ERP' | 'Microsoft Dynamics' | 'Tally' | 'Zoho Books';
      endpoint: string;
      authType: 'OAuth 2.0' | 'API Key' | 'Basic Auth';
      syncFrequency: 'Real-time' | 'Hourly' | 'Daily';
      syncContracts: boolean;
      syncVendors: boolean;
      syncInvoices: boolean;
      syncPayments: boolean;
    };
    gps: {
      connected: boolean;
      provider: string;
      vehiclesTracked: number;
      lastSyncAt: number;
      realtimeEnabled: boolean;
    };
    esign: {
      connected: boolean;
      provider: 'DocuSign' | 'Adobe Sign' | 'DigiLocker' | 'Internal';
      contractsSigned: number;
      pendingSignatures: number;
      autoSend: boolean;
      reminderEveryDays: number;
    };
    sms: {
      connected: boolean;
      provider: string;
      sentMTD: number;
      balance: number;
    };
    whatsapp: {
      status: 'pending_approval' | 'connected' | 'not_connected';
    };
    accounting: {
      connected: boolean;
      provider: 'Zoho Books' | 'QuickBooks' | 'Xero' | 'Tally';
    };
    bi: {
      connected: boolean;
      provider: string;
      lastSyncAt: number;
      dataExportedGB: number;
    };
    webhooks: Array<{
      id: string;
      event: string;
      url: string;
      active: boolean;
      successRate: number;
      lastTriggeredAt: number;
    }>;
    apiKeys: Array<{
      id: string;
      name: string;
      keyMasked: string;
      createdAt: number;
      lastUsedAt: number;
      permissions: string;
      rateLimitPerHour: number;
      active: boolean;
    }>;
  };
  securityPrivacy: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      expiryDays: number;
      historyCount: number;
    };
    twoFactor: {
      enforceForAdmins: boolean;
      enforceForAllUsers: boolean;
      methods: {
        sms: boolean;
        authenticator: boolean;
        email: boolean;
        hardware: boolean;
      };
    };
    session: {
      timeoutMinutes: number;
      maxConcurrentSessions: number;
      rememberMeDays: number;
      logoutOnBrowserClose: boolean;
    };
    ipSecurity: {
      ipWhitelistingEnabled: boolean;
      whitelist: Array<{ cidr: string; label: string; active: boolean }>;
      lockAfterAttempts: number;
      lockDurationMinutes: number;
      alertAdminOnSuspicious: boolean;
    };
    dataPrivacy: {
      anonymizeInReports: boolean;
      vendorAliases: boolean;
      bidAnonymity: boolean;
      gdprAccess: boolean;
      gdprDeletion: boolean;
      retentionYears: number;
      consentTracking: boolean;
    };
    auditLog: {
      level: 'Minimal' | 'Standard' | 'Verbose';
      retentionYears: number;
    };
    backup: {
      autoBackupEnabled: boolean;
      frequency: 'Daily' | 'Weekly' | 'Monthly';
      runAt: string;
      retentionDays: number;
      lastBackupAt: number;
      backupSizeGB: number;
      location: 'AWS S3' | 'Google Cloud Storage' | 'Azure Blob Storage';
      manualBackupProgressPct: number;
      lastDRTestAt: number;
      drStatus: 'passed' | 'failed';
    };
  };
  localization: {
    defaultLanguage: 'English' | 'Hindi' | 'Tamil' | 'Telugu' | 'Bengali' | 'Marathi';
    allowUserLanguageSelection: boolean;
    languageProgress: Array<{ language: string; progressPct: number; enabled: boolean }>;
    region: string;
    currencyAutoConvert: boolean;
    exchangeRateSource: 'Manual' | 'API';
    exchangeRateUpdate: 'Daily' | 'Weekly' | 'Monthly';
    gstEnabled: boolean;
    gstRate: number;
    tdsApplicable: boolean;
    tdsRate: number;
  };
  advanced: {
    dbConnectionPool: number;
    queryTimeoutSec: number;
    cacheStrategy: 'In-Memory (Redis)' | 'Database' | 'Hybrid';
    cdnEnabled: boolean;
    featureFlags: {
      aiVendorRecommendations: boolean;
      predictivePricing: boolean;
      blockchainAuditTrail: boolean;
      voiceCommands: boolean;
      darkMode: boolean;
    };
    maintenanceMode: boolean;
    cacheSizeGB: number;
    autoClearCacheDays: number;
    debugMode: boolean;
    appLogLevel: 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';
    maxLogSizeMB: number;
    autoRotateLogs: boolean;
    sentryEnabled: boolean;
    errorCount24h: number;
    systemInfo: {
      platformVersion: string;
      dbVersion: string;
      serverType: string;
      region: string;
      uptimeHours: number;
      totalStorageGB: number;
      storageUsedPct: number;
      memoryUsedGB: number;
      memoryTotalGB: number;
      cpuAvgPct: number;
      activeUsers: number;
      dbSizeGB: number;
    };
  };
}

export interface SettingsAuditEntry {
  id: string;
  timestamp: number;
  changedBy: string;
  section: string;
  setting: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'MODIFIED' | 'ADDED' | 'REMOVED';
  ipAddress: string;
  reason: string;
}

const STORAGE_SETTINGS_KEY = 'optimile-system-settings-v1';
const STORAGE_AUDIT_KEY = 'optimile-system-settings-audit-v1';

function randId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.');
  let ref: Record<string, unknown> = obj;
  keys.forEach((key, idx) => {
    if (idx === keys.length - 1) {
      ref[key] = value;
      return;
    }
    if (!ref[key] || typeof ref[key] !== 'object') {
      ref[key] = {};
    }
    ref = ref[key] as Record<string, unknown>;
  });
}

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flatten(value as Record<string, unknown>, path));
    } else {
      out[path] = value;
    }
  });
  return out;
}

function toYaml(value: unknown, depth = 0): string {
  const indent = '  '.repeat(depth);
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === 'object') {
          return `${indent}-\n${toYaml(item, depth + 1)}`;
        }
        return `${indent}- ${String(item)}`;
      })
      .join('\n');
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => {
        if (v && typeof v === 'object') {
          return `${indent}${k}:\n${toYaml(v, depth + 1)}`;
        }
        return `${indent}${k}: ${String(v)}`;
      })
      .join('\n');
  }
  return `${indent}${String(value)}`;
}

function downloadTextFile(filename: string, text: string, mimeType: string) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function defaultSettings(): SystemSettings {
  return {
    general: {
      platformName: 'Optimile AMS',
      organization: 'Optimile',
      supportEmail: 'support@optimile.com',
      supportPhone: '+91-9876543210',
      platformUrl: 'https://ams.optimile.com',
      logoUrl: '',
      faviconUrl: '',
      currency: 'INR',
      currencyDisplay: 'indian',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      decimalPlaces: 2,
      financialYearStart: 'April',
      availability24x7: true,
      businessHours: {
        start: '09:00',
        end: '18:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      },
      maintenance: {
        enabled: false,
        startAt: '',
        durationHours: 2,
        notifyBeforeHours: 24,
      },
    },
    auctionDefaults: {
      defaultAuctionType: 'REVERSE',
      decrementINR: 100,
      extensionThresholdSec: 10,
      extensionDurationSec: 120,
      maxExtensions: 10,
      laneDurationSec: 300,
      minVendors: 3,
      autoInviteEligibleVendors: true,
      vendorRegistration: 'approval_required',
      anonymousBidding: true,
      rankDisplay: true,
      winnerTimeoutHours: 24,
      autoAwardRunnerUp: true,
      acceptanceThresholdPct: 5,
      contractAutoGeneration: true,
      eSignatureRequired: true,
      bidRateLimitEnabled: true,
      maxBidsPerMinute: 10,
      analyticsCacheMinutes: 5,
      autoArchiveEnabled: true,
      autoArchiveDays: 90,
    },
    notifications: {
      email: {
        service: 'SMTP',
        fromName: 'Optimile Auctions',
        fromEmail: 'noreply@optimile.com',
        replyToEmail: 'support@optimile.com',
        events: {
          auctionInvitation: true,
          auctionStartingSoon: true,
          outbidAlert: true,
          winnerAnnouncement: true,
          contractReady: true,
          paymentReminder: true,
          documentExpiryWarning: true,
          newVendorRegistration: true,
          auctionStarted: true,
          auctionCompleted: true,
          winnerDeclined: true,
          disputeRaised: true,
          lowParticipationAlert: true,
          clientResultsAvailable: true,
          clientContractSigned: true,
          monthlySavingsReport: true,
        },
      },
      sms: {
        service: 'MSG91',
        creditsRemaining: 5430,
        lowCreditsAlert: 500,
        events: {
          winnerAnnouncement: true,
          acceptanceDeadline: true,
          paymentOverdue: true,
        },
      },
      inApp: {
        pushEnabled: true,
        soundEnabled: true,
        soundFile: 'notification-sound-1.mp3',
        badgeCountEnabled: true,
        autoDismissSec: 10,
      },
      whatsapp: {
        configured: false,
        status: 'not_configured',
      },
    },
    emailTemplates: {
      templates: [
        {
          id: 'TPL-AUCTION-INVITE',
          category: 'vendor',
          name: 'Auction Invitation',
          subject: 'You are invited: {AUCTION_NAME}',
          body: 'Dear {VENDOR_NAME},\\n\\nYou are invited to participate in {AUCTION_NAME}.',
          active: true,
          sentCount30d: 234,
          openRate: 78,
          lastModifiedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        },
        {
          id: 'TPL-WINNER',
          category: 'vendor',
          name: 'Winner Announcement',
          subject: 'Congratulations! You won {LANE_NAME}',
          body: 'Dear {VENDOR_NAME},\\n\\nYou have won {LANE_NAME}.',
          active: true,
          sentCount30d: 98,
          openRate: 82,
          lastModifiedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        },
      ],
    },
    paymentGateway: {
      primary: 'Razorpay',
      separateVendorGateway: false,
      vendorGateway: 'Razorpay',
      connectionStatus: 'connected',
      apiKeyMasked: 'rz_test_********',
      apiSecretMasked: '********',
      webhookSecretMasked: '********',
      testMode: true,
      emdEnabled: true,
      emdType: 'percentage',
      emdValue: 5,
      refundNonWinners: true,
      refundTimelineDays: 7,
      autoRefund: true,
      paymentMethods: {
        cards: true,
        netBanking: true,
        upi: true,
        wallets: true,
        internationalCards: false,
        crypto: false,
      },
      transactionFeeBorneBy: 'vendor',
      threeDSecureMandatory: true,
      autoCapture: true,
      paymentLogsRetentionMonths: 12,
      autoReconciliation: true,
      reconciliationTime: '02:00',
      discrepancyAlert: true,
      discrepancyAlertEmail: 'finance@optimile.com',
    },
    integrations: {
      erp: {
        connected: false,
        system: 'SAP',
        endpoint: '',
        authType: 'OAuth 2.0',
        syncFrequency: 'Hourly',
        syncContracts: true,
        syncVendors: true,
        syncInvoices: true,
        syncPayments: true,
      },
      gps: {
        connected: true,
        provider: 'Fleet Track Pro',
        vehiclesTracked: 245,
        lastSyncAt: Date.now() - 5 * 60 * 1000,
        realtimeEnabled: true,
      },
      esign: {
        connected: true,
        provider: 'DocuSign',
        contractsSigned: 156,
        pendingSignatures: 3,
        autoSend: true,
        reminderEveryDays: 2,
      },
      sms: {
        connected: true,
        provider: 'MSG91',
        sentMTD: 1234,
        balance: 5420,
      },
      whatsapp: {
        status: 'pending_approval',
      },
      accounting: {
        connected: false,
        provider: 'Zoho Books',
      },
      bi: {
        connected: true,
        provider: 'Metabase',
        lastSyncAt: Date.now() - 60 * 60 * 1000,
        dataExportedGB: 2.3,
      },
      webhooks: [
        {
          id: 'WH-1',
          event: 'auction.completed',
          url: 'https://api.partner.com/webhook',
          active: true,
          successRate: 98,
          lastTriggeredAt: Date.now() - 2 * 60 * 60 * 1000,
        },
      ],
      apiKeys: [
        {
          id: 'API-1',
          name: 'Mobile App',
          keyMasked: 'opt_live_************',
          createdAt: new Date('2026-01-15T09:00:00Z').getTime(),
          lastUsedAt: Date.now() - 60 * 60 * 1000,
          permissions: 'Read & Write',
          rateLimitPerHour: 1000,
          active: true,
        },
      ],
    },
    securityPrivacy: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: 90,
        historyCount: 5,
      },
      twoFactor: {
        enforceForAdmins: true,
        enforceForAllUsers: false,
        methods: {
          sms: true,
          authenticator: true,
          email: false,
          hardware: false,
        },
      },
      session: {
        timeoutMinutes: 60,
        maxConcurrentSessions: 2,
        rememberMeDays: 30,
        logoutOnBrowserClose: false,
      },
      ipSecurity: {
        ipWhitelistingEnabled: true,
        whitelist: [{ cidr: '192.168.1.0/24', label: 'Office Network', active: true }],
        lockAfterAttempts: 5,
        lockDurationMinutes: 30,
        alertAdminOnSuspicious: true,
      },
      dataPrivacy: {
        anonymizeInReports: true,
        vendorAliases: true,
        bidAnonymity: true,
        gdprAccess: true,
        gdprDeletion: true,
        retentionYears: 7,
        consentTracking: true,
      },
      auditLog: {
        level: 'Standard',
        retentionYears: 3,
      },
      backup: {
        autoBackupEnabled: true,
        frequency: 'Daily',
        runAt: '02:00',
        retentionDays: 30,
        lastBackupAt: Date.now() - 18 * 60 * 60 * 1000,
        backupSizeGB: 2.3,
        location: 'AWS S3',
        manualBackupProgressPct: 0,
        lastDRTestAt: new Date('2026-01-20T10:00:00Z').getTime(),
        drStatus: 'passed',
      },
    },
    localization: {
      defaultLanguage: 'English',
      allowUserLanguageSelection: true,
      languageProgress: [
        { language: 'English', progressPct: 100, enabled: true },
        { language: 'Hindi', progressPct: 95, enabled: true },
        { language: 'Tamil', progressPct: 60, enabled: true },
      ],
      region: 'India (IN)',
      currencyAutoConvert: false,
      exchangeRateSource: 'Manual',
      exchangeRateUpdate: 'Daily',
      gstEnabled: true,
      gstRate: 18,
      tdsApplicable: true,
      tdsRate: 2,
    },
    advanced: {
      dbConnectionPool: 50,
      queryTimeoutSec: 30,
      cacheStrategy: 'In-Memory (Redis)',
      cdnEnabled: true,
      featureFlags: {
        aiVendorRecommendations: true,
        predictivePricing: true,
        blockchainAuditTrail: false,
        voiceCommands: false,
        darkMode: true,
      },
      maintenanceMode: false,
      cacheSizeGB: 1.2,
      autoClearCacheDays: 7,
      debugMode: false,
      appLogLevel: 'INFO',
      maxLogSizeMB: 100,
      autoRotateLogs: true,
      sentryEnabled: true,
      errorCount24h: 5,
      systemInfo: {
        platformVersion: '3.8.2',
        dbVersion: 'PostgreSQL 14.5',
        serverType: 'AWS EC2 t3.large',
        region: 'ap-south-1 (Mumbai)',
        uptimeHours: 1092,
        totalStorageGB: 500,
        storageUsedPct: 45,
        memoryUsedGB: 8,
        memoryTotalGB: 16,
        cpuAvgPct: 35,
        activeUsers: 23,
        dbSizeGB: 15,
      },
    },
  };
}

class SystemSettingsService {
  private settings: SystemSettings;
  private audit: SettingsAuditEntry[];
  private subscribers = new Set<() => void>();

  constructor() {
    this.settings = this.loadSettings();
    this.audit = this.loadAudit();
  }

  subscribe(cb: () => void) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private notify() {
    this.persist();
    this.subscribers.forEach((cb) => cb());
  }

  private persist() {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(this.settings));
    localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(this.audit));
  }

  private loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (!raw) return defaultSettings();
      return JSON.parse(raw) as SystemSettings;
    } catch {
      return defaultSettings();
    }
  }

  private loadAudit() {
    try {
      const raw = localStorage.getItem(STORAGE_AUDIT_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as SettingsAuditEntry[];
    } catch {
      return [];
    }
  }

  getSnapshot() {
    return {
      settings: deepClone(this.settings),
      audit: [...this.audit],
      lastModifiedAt: this.audit[0]?.timestamp || Date.now(),
      lastModifiedBy: this.audit[0]?.changedBy || 'Rajesh Kumar',
    };
  }

  validate(settings: SystemSettings) {
    const errors: string[] = [];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(settings.general.supportEmail)) {
      errors.push('Support email is invalid');
    }
    if (settings.auctionDefaults.decrementINR < 50 || settings.auctionDefaults.decrementINR > 10000) {
      errors.push('Default decrement must be between 50 and 10000');
    }
    if (settings.auctionDefaults.extensionThresholdSec < 5 || settings.auctionDefaults.extensionThresholdSec > 60) {
      errors.push('Extension threshold must be between 5 and 60 seconds');
    }
    if (settings.general.decimalPlaces < 0 || settings.general.decimalPlaces > 4) {
      errors.push('Decimal places must be between 0 and 4');
    }
    if (settings.securityPrivacy.passwordPolicy.minLength < 8) {
      errors.push('Password minimum length must be at least 8');
    }
    return { valid: errors.length === 0, errors };
  }

  saveAll(nextSettings: SystemSettings, actor: string, reason = 'Configuration update', ipAddress = '192.168.1.45') {
    const previousFlat = flatten(this.settings as unknown as Record<string, unknown>);
    const nextFlat = flatten(nextSettings as unknown as Record<string, unknown>);

    Object.entries(nextFlat).forEach(([path, newValue]) => {
      const oldValue = previousFlat[path];
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
      const section = path.split('.')[0] || 'general';
      this.audit.unshift({
        id: randId('CFG-AUD'),
        timestamp: Date.now(),
        changedBy: actor,
        section,
        setting: path,
        oldValue,
        newValue,
        changeType: oldValue === undefined ? 'ADDED' : 'MODIFIED',
        ipAddress,
        reason,
      });
    });

    Object.entries(previousFlat).forEach(([path, oldValue]) => {
      if (path in nextFlat) return;
      const section = path.split('.')[0] || 'general';
      this.audit.unshift({
        id: randId('CFG-AUD'),
        timestamp: Date.now(),
        changedBy: actor,
        section,
        setting: path,
        oldValue,
        newValue: undefined,
        changeType: 'REMOVED',
        ipAddress,
        reason,
      });
    });

    this.settings = deepClone(nextSettings);
    this.notify();
  }

  resetToDefaults(actor: string) {
    this.saveAll(defaultSettings(), actor, 'Reset to defaults');
  }

  revertByAuditId(auditId: string, actor: string) {
    const entry = this.audit.find((item) => item.id === auditId);
    if (!entry) return false;
    const next = deepClone(this.settings) as unknown as Record<string, unknown>;
    setByPath(next, entry.setting, entry.oldValue);
    this.saveAll(next as unknown as SystemSettings, actor, `Reverted ${entry.setting}`);
    return true;
  }

  exportSettings(opts: {
    format: 'json' | 'yaml' | 'pdf';
    includeCategories: Record<string, boolean>;
    includeSensitive: boolean;
  }) {
    const cloned = deepClone(this.settings) as unknown as Record<string, unknown>;
    Object.keys(cloned).forEach((category) => {
      if (!opts.includeCategories[category]) {
        delete cloned[category];
      }
    });

    if (!opts.includeSensitive) {
      if (cloned.paymentGateway && typeof cloned.paymentGateway === 'object') {
        const pg = cloned.paymentGateway as Record<string, unknown>;
        pg.apiKeyMasked = '********';
        pg.apiSecretMasked = '********';
        pg.webhookSecretMasked = '********';
      }
    }

    const date = new Date().toISOString().slice(0, 10);
    if (opts.format === 'json') {
      downloadTextFile(`optimile-settings-${date}.json`, JSON.stringify(cloned, null, 2), 'application/json');
    } else if (opts.format === 'yaml') {
      downloadTextFile(`optimile-settings-${date}.yaml`, toYaml(cloned), 'text/yaml');
    } else {
      const report = `Optimile AMS Settings Export\nDate: ${date}\n\n${JSON.stringify(cloned, null, 2)}`;
      downloadTextFile(`optimile-settings-${date}.pdf`, report, 'application/pdf');
    }
  }

  parseImportFile(text: string, filename: string) {
    try {
      let parsed: unknown;
      if (filename.endsWith('.json')) {
        parsed = JSON.parse(text);
      } else {
        // For mock app: YAML import unsupported parser; accept JSON-like fallback.
        parsed = JSON.parse(text);
      }
      return { valid: true, parsed: parsed as SystemSettings, message: 'Valid configuration file' };
    } catch {
      return { valid: false, parsed: null, message: 'Invalid configuration file format' };
    }
  }

  importSettings(
    imported: SystemSettings,
    actor: string,
    mode: 'overwrite' | 'merge' | 'preview',
  ) {
    if (mode === 'preview') {
      const currentFlat = flatten(this.settings as unknown as Record<string, unknown>);
      const incomingFlat = flatten(imported as unknown as Record<string, unknown>);
      const preview = Object.keys({ ...currentFlat, ...incomingFlat }).map((path) => {
        const current = currentFlat[path];
        const incoming = incomingFlat[path];
        const status = JSON.stringify(current) === JSON.stringify(incoming) ? 'same' : incoming === undefined ? 'removed' : 'modified';
        return { path, current, incoming, status };
      });
      return { applied: false, preview };
    }

    if (mode === 'overwrite') {
      this.saveAll(imported, actor, 'Imported settings (overwrite)');
      return { applied: true };
    }

    const merged = deepClone(this.settings) as unknown as Record<string, unknown>;
    const incomingFlat = flatten(imported as unknown as Record<string, unknown>);
    Object.entries(incomingFlat).forEach(([path, value]) => setByPath(merged, path, value));
    this.saveAll(merged as unknown as SystemSettings, actor, 'Imported settings (merge)');
    return { applied: true };
  }

  getSetting(path: string) {
    return getByPath(this.settings as unknown as Record<string, unknown>, path);
  }

  setSetting(path: string, value: unknown, actor: string) {
    const next = deepClone(this.settings) as unknown as Record<string, unknown>;
    setByPath(next, path, value);
    this.saveAll(next as unknown as SystemSettings, actor, `Updated ${path}`);
  }
}

export const systemSettingsService = new SystemSettingsService();
