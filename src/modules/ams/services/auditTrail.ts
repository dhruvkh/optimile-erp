import { auctionEngine } from './mockBackend';
import { rbacService } from './rbac';
import { systemSettingsService } from './systemSettings';
import type { AuditEvent as EngineAuditEvent } from '../types';

export const AUDIT_COLORS = {
  success: '#00C853',
  info: '#2979FF',
  warning: '#FFB300',
  error: '#FF1744',
  critical: '#D500F9',
  system: '#00BFA5',
  deleted: '#FF6D00',
} as const;

export type AuditEventType =
  | 'user_action'
  | 'system_event'
  | 'security'
  | 'data_change'
  | 'integration'
  | 'failed_action';

export type AuditStatus = 'success' | 'failed' | 'warning';
export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'denied'
  | 'approve'
  | 'reject'
  | 'execute';

export interface UnifiedAuditLog {
  logId: string;
  timestamp: number;
  eventType: AuditEventType;
  eventTypeLabel: string;
  eventTypeColor: string;
  actor: {
    userId: string;
    userName: string;
    userRole: string;
    userRoleColor: string;
    actorType: 'user' | 'system' | 'api_client';
    sessionId?: string;
    apiKeyId?: string;
  };
  action: AuditAction;
  actionLabel: string;
  actionColor: string;
  resource: {
    resourceType: string;
    resourceId: string;
    resourceName: string;
    resourceUrl?: string;
  };
  details: {
    description: string;
    requestPayload?: Record<string, unknown>;
    responseData?: Record<string, unknown>;
    changedFields?: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
    errorMessage?: string;
    errorCode?: string;
    stackTrace?: string;
  };
  status: AuditStatus;
  statusColor: string;
  metadata: {
    ipAddress: string;
    location: {
      city: string;
      country: string;
      countryCode: string;
    };
    device: {
      browser: string;
      os: string;
      deviceType: 'desktop' | 'mobile' | 'tablet' | 'server';
    };
    durationMs: number;
    userAgent: string;
  };
  security: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    riskScore: number;
    isSuspicious: boolean;
    alertTriggered: boolean;
    alertId?: string;
  };
  compliance: {
    isAuditable: boolean;
    retentionMonths: number;
    isArchived: boolean;
    archivedAt?: number;
    reviewed: boolean;
  };
  relatedLogs: string[];
  source: 'engine' | 'rbac' | 'settings' | 'synthetic';
}

export interface AuditAlertRule {
  id: string;
  name: string;
  eventType: AuditEventType;
  action?: AuditAction;
  threshold: number;
  withinMinutes: number;
  scope: 'same_ip' | 'same_user' | 'any';
  severity: 'critical' | 'high' | 'medium' | 'low';
  notifyEmail: boolean;
  notifySms: boolean;
  notifyInApp: boolean;
  notifySlack: boolean;
  autoBlockIp: boolean;
  autoLockUser: boolean;
  active: boolean;
  lastTriggeredAt?: number;
  triggerCountToday: number;
}

export interface AuditAlertHistory {
  id: string;
  ruleId: string;
  timestamp: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  triggerReason: string;
  actionTaken: string;
  acknowledgedBy?: string;
  status: 'resolved' | 'active';
}

export interface AuditRetentionPolicy {
  userActionsMonths: number;
  securityEventsMonths: number;
  dataChangesMonths: number;
  systemEventsMonths: number;
  apiLogsMonths: number;
  autoArchive: boolean;
  archiveAfterDays: number;
  compressionEnabled: boolean;
  storageLocation: 'Database' | 'S3' | 'Azure Blob';
  activeLogsGB: number;
  archivedLogsGB: number;
  alertAtGB: number;
}

const STORAGE_KEY_RULES = 'optimile-audit-alert-rules-v1';
const STORAGE_KEY_RETENTION = 'optimile-audit-retention-v1';
const STORAGE_KEY_REVIEWED = 'optimile-audit-reviewed-v1';

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function metaFromActor(actor: string, seedInput: string): UnifiedAuditLog['metadata'] {
  const seed = hashCode(`${actor}-${seedInput}`);
  const cities = [
    { city: 'Mumbai', country: 'India', countryCode: 'IN' },
    { city: 'Delhi', country: 'India', countryCode: 'IN' },
    { city: 'Bengaluru', country: 'India', countryCode: 'IN' },
    { city: 'Pune', country: 'India', countryCode: 'IN' },
    { city: 'Chennai', country: 'India', countryCode: 'IN' },
  ];
  const location = cities[seed % cities.length] as { city: string; country: string; countryCode: string };
  const browsers = ['Chrome', 'Safari', 'Edge', 'Firefox'];
  const oses = ['Windows 11', 'macOS', 'Ubuntu', 'Android'];
  const browser = browsers[seed % browsers.length] as string;
  const os = oses[(seed >> 1) % oses.length] as string;
  return {
    ipAddress: `192.168.${(seed % 20) + 1}.${(seed % 200) + 20}`,
    location,
    device: {
      browser,
      os,
      deviceType: actor === 'SYSTEM' ? 'server' : 'desktop',
    },
    durationMs: (seed % 1400) + 100,
    userAgent: `${browser} on ${os}`,
  };
}

function actionFromEngineEvent(eventType: string): AuditAction {
  if (eventType.includes('CREATED') || eventType === 'BID_PLACED' || eventType.includes('CONFIGURED')) return 'create';
  if (eventType.includes('UPDATED') || eventType.includes('STATUS_CHANGE') || eventType.includes('EXTENDED')) return 'update';
  if (eventType.includes('CLOSED')) return 'execute';
  return 'read';
}

function statusFromRbac(status: string): AuditStatus {
  if (status === 'FAILED') return 'failed';
  return 'success';
}

function colorForStatus(status: AuditStatus) {
  if (status === 'success') return AUDIT_COLORS.success;
  if (status === 'warning') return AUDIT_COLORS.warning;
  return AUDIT_COLORS.error;
}

function eventColor(eventType: AuditEventType) {
  if (eventType === 'security') return AUDIT_COLORS.critical;
  if (eventType === 'system_event') return AUDIT_COLORS.system;
  if (eventType === 'failed_action') return AUDIT_COLORS.error;
  if (eventType === 'data_change') return AUDIT_COLORS.success;
  if (eventType === 'integration') return AUDIT_COLORS.warning;
  return AUDIT_COLORS.info;
}

function eventLabel(eventType: AuditEventType) {
  if (eventType === 'user_action') return 'USER ACTION';
  if (eventType === 'system_event') return 'SYSTEM EVENT';
  if (eventType === 'security') return 'SECURITY';
  if (eventType === 'data_change') return 'DATA CHANGE';
  if (eventType === 'integration') return 'INTEGRATION';
  return 'FAILED';
}

function actionLabel(action: AuditAction) {
  if (action === 'create') return 'CREATED';
  if (action === 'read') return 'VIEWED';
  if (action === 'update') return 'UPDATED';
  if (action === 'delete') return 'DELETED';
  if (action === 'login') return 'LOGGED IN';
  if (action === 'logout') return 'LOGGED OUT';
  if (action === 'denied') return 'DENIED';
  if (action === 'approve') return 'APPROVED';
  if (action === 'reject') return 'REJECTED';
  return 'EXECUTED';
}

function actionColor(action: AuditAction) {
  if (action === 'create' || action === 'approve' || action === 'login') return AUDIT_COLORS.success;
  if (action === 'read') return AUDIT_COLORS.info;
  if (action === 'update') return AUDIT_COLORS.warning;
  if (action === 'delete') return AUDIT_COLORS.deleted;
  if (action === 'denied' || action === 'reject' || action === 'logout') return AUDIT_COLORS.error;
  return AUDIT_COLORS.system;
}

function defaultRules(): AuditAlertRule[] {
  return [
    {
      id: 'ALERT-FAILED-LOGIN',
      name: 'Multiple Failed Logins',
      eventType: 'security',
      action: 'denied',
      threshold: 5,
      withinMinutes: 15,
      scope: 'same_ip',
      severity: 'critical',
      notifyEmail: true,
      notifySms: true,
      notifyInApp: true,
      notifySlack: true,
      autoBlockIp: true,
      autoLockUser: false,
      active: true,
      triggerCountToday: 0,
    },
    {
      id: 'ALERT-PERMISSION-DENIED',
      name: 'Permission Denial Spike',
      eventType: 'failed_action',
      action: 'denied',
      threshold: 10,
      withinMinutes: 60,
      scope: 'any',
      severity: 'high',
      notifyEmail: true,
      notifySms: false,
      notifyInApp: true,
      notifySlack: true,
      autoBlockIp: false,
      autoLockUser: false,
      active: true,
      triggerCountToday: 0,
    },
  ];
}

function defaultRetention(): AuditRetentionPolicy {
  return {
    userActionsMonths: 12,
    securityEventsMonths: 24,
    dataChangesMonths: 12,
    systemEventsMonths: 6,
    apiLogsMonths: 3,
    autoArchive: true,
    archiveAfterDays: 90,
    compressionEnabled: true,
    storageLocation: 'S3',
    activeLogsGB: 2.3,
    archivedLogsGB: 8.7,
    alertAtGB: 50,
  };
}

class AuditTrailService {
  private logs: UnifiedAuditLog[] = [];
  private alertRules: AuditAlertRule[] = [];
  private alertHistory: AuditAlertHistory[] = [];
  private retention: AuditRetentionPolicy;
  private subscribers = new Set<() => void>();
  private reviewed = new Set<string>();
  private syntheticEvents: UnifiedAuditLog[] = [];
  private timer: number;

  constructor() {
    this.alertRules = this.loadAlertRules();
    this.retention = this.loadRetention();
    this.reviewed = this.loadReviewed();
    this.refresh();

    auctionEngine.subscribe(() => this.refresh());
    rbacService.subscribe(() => this.refresh());
    systemSettingsService.subscribe(() => this.refresh());

    this.timer = window.setInterval(() => {
      this.generateSyntheticEvent();
      this.refresh();
    }, 10000);
  }

  subscribe(cb: () => void) {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notify() {
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(this.alertRules));
    localStorage.setItem(STORAGE_KEY_RETENTION, JSON.stringify(this.retention));
    localStorage.setItem(STORAGE_KEY_REVIEWED, JSON.stringify(Array.from(this.reviewed)));
    this.subscribers.forEach((cb) => cb());
  }

  private loadAlertRules() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RULES);
      if (!raw) return defaultRules();
      return JSON.parse(raw) as AuditAlertRule[];
    } catch {
      return defaultRules();
    }
  }

  private loadRetention() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RETENTION);
      if (!raw) return defaultRetention();
      return JSON.parse(raw) as AuditRetentionPolicy;
    } catch {
      return defaultRetention();
    }
  }

  private loadReviewed() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REVIEWED);
      if (!raw) return new Set<string>();
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return new Set<string>();
    }
  }

  private retentionForEvent(eventType: AuditEventType) {
    if (eventType === 'security') return this.retention.securityEventsMonths;
    if (eventType === 'data_change') return this.retention.dataChangesMonths;
    if (eventType === 'system_event') return this.retention.systemEventsMonths;
    if (eventType === 'integration') return this.retention.apiLogsMonths;
    return this.retention.userActionsMonths;
  }

  private mapEngineEvent(entry: EngineAuditEvent): UnifiedAuditLog {
    const triggeredBy = entry.triggeredBy || 'SYSTEM';
    const action = actionFromEngineEvent(entry.eventType);
    const eventType: AuditEventType =
      triggeredBy === 'SYSTEM'
        ? 'system_event'
        : entry.eventType.includes('BID') || entry.eventType.includes('UPDATED') || entry.eventType.includes('CREATED')
          ? 'data_change'
          : 'user_action';

    const status: AuditStatus = entry.eventType.includes('BREACHED') ? 'warning' : 'success';
    const isSuspicious = entry.eventType.includes('BREACHED');

    return {
      logId: `ENG-${entry.id}`,
      timestamp: entry.createdAt,
      eventType,
      eventTypeLabel: eventLabel(eventType),
      eventTypeColor: eventColor(eventType),
      actor: {
        userId: triggeredBy,
        userName: triggeredBy === 'SYSTEM' ? 'System' : triggeredBy,
        userRole: triggeredBy === 'SYSTEM' ? 'SYSTEM' : 'USER',
        userRoleColor: triggeredBy === 'SYSTEM' ? AUDIT_COLORS.system : AUDIT_COLORS.info,
        actorType: triggeredBy === 'SYSTEM' ? 'system' : 'user',
        sessionId: `sess-${entry.id.slice(0, 8)}`,
      },
      action,
      actionLabel: actionLabel(action),
      actionColor: actionColor(action),
      resource: {
        resourceType: entry.entityType,
        resourceId: entry.entityId,
        resourceName: `${entry.entityType} ${entry.entityId.slice(0, 8)}`,
        resourceUrl: '#',
      },
      details: {
        description: `${entry.eventType} on ${entry.entityType}`,
        requestPayload: entry.payload,
        responseData: { result: 'ok' },
      },
      status,
      statusColor: colorForStatus(status),
      metadata: metaFromActor(triggeredBy, entry.id),
      security: {
        severity: isSuspicious ? 'high' : 'low',
        riskScore: isSuspicious ? 72 : 20,
        isSuspicious,
        alertTriggered: false,
      },
      compliance: {
        isAuditable: true,
        retentionMonths: this.retentionForEvent(eventType),
        isArchived: false,
        reviewed: this.reviewed.has(`ENG-${entry.id}`),
      },
      relatedLogs: [],
      source: 'engine',
    };
  }

  private mapRbacEvent(entry: ReturnType<typeof rbacService.getSnapshot>['auditLog'][number]): UnifiedAuditLog {
    const actionMap: Record<string, AuditAction> = {
      PERMISSION_GRANTED: 'approve',
      PERMISSION_REVOKED: 'reject',
      ROLE_CHANGED: 'update',
      ACCESS_DENIED: 'denied',
      LOGIN: 'login',
      LOGOUT: 'logout',
      ROLE_CREATED: 'create',
      ROLE_UPDATED: 'update',
      REQUEST_CREATED: 'create',
      REQUEST_APPROVED: 'approve',
      REQUEST_REJECTED: 'reject',
    };
    const action = actionMap[entry.action] || 'read';
    const status = statusFromRbac(entry.status);
    const eventType: AuditEventType =
      entry.action === 'ACCESS_DENIED'
        ? 'security'
        : status === 'failed'
          ? 'failed_action'
          : entry.action.includes('REQUEST') || entry.action.includes('ROLE') || entry.action.includes('PERMISSION')
            ? 'data_change'
            : 'user_action';

    const isSuspicious = entry.action === 'ACCESS_DENIED' || status === 'failed';

    return {
      logId: `RBAC-${entry.id}`,
      timestamp: entry.timestamp,
      eventType,
      eventTypeLabel: eventLabel(eventType),
      eventTypeColor: eventColor(eventType),
      actor: {
        userId: entry.user,
        userName: entry.user,
        userRole: entry.role,
        userRoleColor: AUDIT_COLORS.info,
        actorType: entry.user.toUpperCase() === 'SYSTEM' ? 'system' : 'user',
      },
      action,
      actionLabel: actionLabel(action),
      actionColor: actionColor(action),
      resource: {
        resourceType: 'RBAC',
        resourceId: entry.id,
        resourceName: entry.resource,
        resourceUrl: '/admin/settings/roles-permissions',
      },
      details: {
        description: entry.details,
        errorCode: status === 'failed' ? '403' : undefined,
        errorMessage: status === 'failed' ? entry.details || 'Insufficient permissions' : undefined,
      },
      status,
      statusColor: colorForStatus(status),
      metadata: metaFromActor(entry.user, entry.id),
      security: {
        severity: isSuspicious ? 'high' : 'low',
        riskScore: isSuspicious ? 80 : 24,
        isSuspicious,
        alertTriggered: false,
      },
      compliance: {
        isAuditable: true,
        retentionMonths: this.retentionForEvent(eventType),
        isArchived: false,
        reviewed: this.reviewed.has(`RBAC-${entry.id}`),
      },
      relatedLogs: [],
      source: 'rbac',
    };
  }

  private mapSettingsEntry(entry: ReturnType<typeof systemSettingsService.getSnapshot>['audit'][number]): UnifiedAuditLog {
    return {
      logId: `CFG-${entry.id}`,
      timestamp: entry.timestamp,
      eventType: 'data_change',
      eventTypeLabel: eventLabel('data_change'),
      eventTypeColor: eventColor('data_change'),
      actor: {
        userId: entry.changedBy,
        userName: entry.changedBy,
        userRole: 'ADMIN',
        userRoleColor: AUDIT_COLORS.error,
        actorType: 'user',
      },
      action: entry.changeType === 'ADDED' ? 'create' : entry.changeType === 'REMOVED' ? 'delete' : 'update',
      actionLabel: entry.changeType === 'ADDED' ? 'CREATED' : entry.changeType === 'REMOVED' ? 'DELETED' : 'UPDATED',
      actionColor: entry.changeType === 'ADDED' ? AUDIT_COLORS.success : entry.changeType === 'REMOVED' ? AUDIT_COLORS.deleted : AUDIT_COLORS.warning,
      resource: {
        resourceType: 'SETTING',
        resourceId: entry.id,
        resourceName: entry.setting,
        resourceUrl: '/admin/settings/system',
      },
      details: {
        description: `${entry.setting} changed`,
        changedFields: [{ field: entry.setting, oldValue: entry.oldValue, newValue: entry.newValue }],
      },
      status: 'success',
      statusColor: colorForStatus('success'),
      metadata: {
        ...metaFromActor(entry.changedBy, entry.id),
        ipAddress: entry.ipAddress,
      },
      security: {
        severity: entry.section.includes('security') ? 'medium' : 'low',
        riskScore: entry.section.includes('security') ? 55 : 18,
        isSuspicious: false,
        alertTriggered: false,
      },
      compliance: {
        isAuditable: true,
        retentionMonths: this.retentionForEvent('data_change'),
        isArchived: false,
        reviewed: this.reviewed.has(`CFG-${entry.id}`),
      },
      relatedLogs: [],
      source: 'settings',
    };
  }

  private generateSyntheticEvent() {
    const now = Date.now();
    const scenarios: Array<Partial<UnifiedAuditLog>> = [
      {
        eventType: 'system_event',
        action: 'execute',
        resource: { resourceType: 'SYSTEM', resourceId: `SYS-${now}`, resourceName: 'Health Check', resourceUrl: '#' },
        details: { description: 'Scheduled health check completed successfully.' },
        status: 'success',
      },
      {
        eventType: 'integration',
        action: 'execute',
        resource: { resourceType: 'WEBHOOK', resourceId: `WH-${now}`, resourceName: 'auction.completed', resourceUrl: '#' },
        details: { description: 'Outgoing webhook delivered to partner endpoint.' },
        status: 'success',
      },
      {
        eventType: 'failed_action',
        action: 'denied',
        resource: { resourceType: 'AUTH', resourceId: `AUTH-${now}`, resourceName: 'Failed Login Attempt', resourceUrl: '#' },
        details: { description: 'Failed login attempt detected from unknown IP.', errorCode: '401', errorMessage: 'Invalid credentials' },
        status: 'failed',
      },
    ];
    const choice = randomChoice(scenarios);
    const eventType = (choice.eventType || 'system_event') as AuditEventType;
    const action = (choice.action || 'execute') as AuditAction;
    const status = (choice.status || 'success') as AuditStatus;
    const id = `SYN-${now}`;

    const entry: UnifiedAuditLog = {
      logId: id,
      timestamp: now,
      eventType,
      eventTypeLabel: eventLabel(eventType),
      eventTypeColor: eventColor(eventType),
      actor: {
        userId: 'SYSTEM',
        userName: 'System',
        userRole: 'SYSTEM',
        userRoleColor: AUDIT_COLORS.system,
        actorType: 'system',
      },
      action,
      actionLabel: actionLabel(action),
      actionColor: actionColor(action),
      resource: choice.resource as UnifiedAuditLog['resource'],
      details: choice.details as UnifiedAuditLog['details'],
      status,
      statusColor: colorForStatus(status),
      metadata: metaFromActor('SYSTEM', id),
      security: {
        severity: status === 'failed' ? 'high' : 'low',
        riskScore: status === 'failed' ? 68 : 16,
        isSuspicious: status === 'failed',
        alertTriggered: false,
      },
      compliance: {
        isAuditable: true,
        retentionMonths: this.retentionForEvent(eventType),
        isArchived: false,
        reviewed: false,
      },
      relatedLogs: [],
      source: 'synthetic',
    };

    this.syntheticEvents.unshift(entry);
    this.syntheticEvents = this.syntheticEvents.slice(0, 600);
  }

  private evaluateAlerts(logs: UnifiedAuditLog[]) {
    const now = Date.now();
    const sinceStartOfDay = new Date();
    sinceStartOfDay.setHours(0, 0, 0, 0);
    this.alertRules.forEach((rule) => {
      if (!rule.active) return;
      const windowStart = now - rule.withinMinutes * 60 * 1000;
      const filtered = logs.filter((l) => {
        if (l.timestamp < windowStart) return false;
        if (l.eventType !== rule.eventType) return false;
        if (rule.action && l.action !== rule.action) return false;
        return true;
      });

      const trigger = filtered.length >= rule.threshold;
      if (!trigger) {
        rule.triggerCountToday = this.alertHistory.filter((h) => h.ruleId === rule.id && h.timestamp >= sinceStartOfDay.getTime()).length;
        return;
      }

      const recentHistory = this.alertHistory.find((h) => h.ruleId === rule.id && now - h.timestamp < rule.withinMinutes * 60 * 1000);
      if (recentHistory) return;

      const reason = `${filtered.length} events matched rule ${rule.name} in ${rule.withinMinutes} minutes`;
      const history: AuditAlertHistory = {
        id: `ALH-${Math.random().toString(36).slice(2, 9)}`,
        ruleId: rule.id,
        timestamp: now,
        severity: rule.severity,
        triggerReason: reason,
        actionTaken: rule.autoBlockIp ? 'IP Blocked' : rule.autoLockUser ? 'Account Locked' : 'Alert Sent',
        status: 'active',
      };
      this.alertHistory.unshift(history);
      rule.lastTriggeredAt = now;
      rule.triggerCountToday += 1;

      filtered.slice(0, 5).forEach((item) => {
        item.security.alertTriggered = true;
        item.security.alertId = rule.id;
      });
    });
  }

  refresh() {
    const engine = auctionEngine.getSnapshot().auditLog.map((x) => this.mapEngineEvent(x));
    const rbac = rbacService.getSnapshot().auditLog.map((x) => this.mapRbacEvent(x));
    const cfg = systemSettingsService.getSnapshot().audit.map((x) => this.mapSettingsEntry(x));

    const merged = [...this.syntheticEvents, ...cfg, ...rbac, ...engine]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15000)
      .map((entry) => ({
        ...entry,
        compliance: {
          ...entry.compliance,
          reviewed: this.reviewed.has(entry.logId),
        },
      }));

    this.evaluateAlerts(merged);
    this.logs = merged;
    this.notify();
  }

  getSnapshot() {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLogs = this.logs.filter((l) => l.timestamp >= todayStart.getTime());

    const successCount = todayLogs.filter((l) => l.status === 'success').length;
    const failedCount = todayLogs.filter((l) => l.status === 'failed').length;
    const warningCount = todayLogs.filter((l) => l.status === 'warning').length;

    const criticalSecurityEvents = this.logs.filter((l) => l.eventType === 'security' && l.security.severity === 'critical' && now - l.timestamp < 24 * 60 * 60 * 1000).length;

    return {
      logs: this.logs,
      alertRules: this.alertRules,
      alertHistory: this.alertHistory,
      retention: this.retention,
      stats: {
        todayTotal: todayLogs.length,
        todaySuccess: successCount,
        todayFailed: failedCount,
        todayWarning: warningCount,
        userActions: todayLogs.filter((l) => l.eventType === 'user_action').length,
        systemEvents: todayLogs.filter((l) => l.eventType === 'system_event').length,
        dataChanges: todayLogs.filter((l) => l.eventType === 'data_change').length,
        securityEvents: todayLogs.filter((l) => l.eventType === 'security').length,
        failedActions: todayLogs.filter((l) => l.eventType === 'failed_action').length,
        criticalSecurityEvents,
        activeUsers: new Set(
          this.logs
            .filter((l) => now - l.timestamp < 2 * 60 * 60 * 1000)
            .filter((l) => l.actor.actorType === 'user')
            .map((l) => l.actor.userName),
        ).size,
        peakActiveUsers: 45,
      },
      lastUpdateAt: now,
    };
  }

  markReviewed(logIds: string[]) {
    logIds.forEach((id) => this.reviewed.add(id));
    this.refresh();
  }

  revertLog(logId: string, actor: string, reason: string) {
    const log = this.logs.find((l) => l.logId === logId);
    if (!log) return { ok: false, message: 'Log not found' };
    if (log.source === 'settings') {
      const cfgId = logId.replace('CFG-', '');
      const ok = systemSettingsService.revertByAuditId(cfgId, actor);
      if (!ok) return { ok: false, message: 'Unable to revert setting change' };
    }

    const revertEntry: UnifiedAuditLog = {
      ...log,
      logId: `REVERT-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      eventType: 'data_change',
      eventTypeLabel: eventLabel('data_change'),
      eventTypeColor: eventColor('data_change'),
      action: 'update',
      actionLabel: 'UPDATED',
      actionColor: AUDIT_COLORS.warning,
      details: {
        description: `Reverted change for ${log.resource.resourceName}`,
        responseData: { reason },
      },
      status: 'success',
      statusColor: AUDIT_COLORS.success,
      actor: {
        userId: actor,
        userName: actor,
        userRole: 'ADMIN',
        userRoleColor: AUDIT_COLORS.error,
        actorType: 'user',
      },
      source: 'synthetic',
    };

    this.syntheticEvents.unshift(revertEntry);
    this.refresh();
    return { ok: true, message: 'Reverted successfully' };
  }

  createAlertRule(input: Omit<AuditAlertRule, 'id' | 'lastTriggeredAt' | 'triggerCountToday'>) {
    const rule: AuditAlertRule = {
      ...input,
      id: `ALERT-${Math.random().toString(36).slice(2, 9)}`,
      triggerCountToday: 0,
    };
    this.alertRules.unshift(rule);
    this.notify();
    return rule.id;
  }

  updateAlertRule(ruleId: string, patch: Partial<AuditAlertRule>) {
    this.alertRules = this.alertRules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r));
    this.notify();
  }

  deleteAlertRule(ruleId: string) {
    this.alertRules = this.alertRules.filter((r) => r.id !== ruleId);
    this.notify();
  }

  resolveAlertHistory(id: string, by: string) {
    this.alertHistory = this.alertHistory.map((h) =>
      h.id === id
        ? {
            ...h,
            acknowledgedBy: by,
            status: 'resolved',
          }
        : h,
    );
    this.notify();
  }

  updateRetention(patch: Partial<AuditRetentionPolicy>) {
    this.retention = { ...this.retention, ...patch };
    this.notify();
  }

  archiveOlderThan(timestamp: number) {
    this.logs = this.logs.map((l) => {
      if (l.timestamp < timestamp) {
        return {
          ...l,
          compliance: {
            ...l.compliance,
            isArchived: true,
            archivedAt: Date.now(),
          },
        };
      }
      return l;
    });
    this.retention = {
      ...this.retention,
      archivedLogsGB: Number((this.retention.archivedLogsGB + 0.2).toFixed(1)),
      activeLogsGB: Number(Math.max(0.5, this.retention.activeLogsGB - 0.1).toFixed(1)),
    };
    this.notify();
  }

  purgeArchived() {
    this.logs = this.logs.filter((l) => !l.compliance.isArchived);
    this.retention = {
      ...this.retention,
      archivedLogsGB: 0,
    };
    this.notify();
  }

  exportLogs(logs: UnifiedAuditLog[], format: 'csv' | 'json' | 'excel') {
    const date = new Date().toISOString().slice(0, 10);
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      this.download(`audit-log-${date}.json`, blob);
      return;
    }

    const rows = [
      ['timestamp', 'eventType', 'user', 'action', 'resourceType', 'resourceName', 'status', 'ip', 'details'].join(','),
      ...logs.map((l) => {
        return [
          new Date(l.timestamp).toISOString(),
          l.eventType,
          l.actor.userName,
          l.action,
          l.resource.resourceType,
          l.resource.resourceName,
          l.status,
          l.metadata.ipAddress,
          `"${l.details.description.replace(/"/g, '""')}"`,
        ].join(',');
      }),
    ];

    const blob = new Blob([rows.join('\n')], {
      type: format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv',
    });
    this.download(`audit-log-${date}.${format === 'excel' ? 'xls' : 'csv'}`, blob);
  }

  private download(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

export const auditTrailService = new AuditTrailService();
