export const ROLE_COLORS = {
  superAdmin: '#D500F9',
  admin: '#FF1744',
  manager: '#2979FF',
  user: '#00C853',
  viewer: '#FFB300',
  vendor: '#00BFA5',
  client: '#FF6D00',
  activeSession: '#76FF03',
  inactive: '#757575',
};

export type RoleKey =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'PROCUREMENT_MANAGER'
  | 'AUCTION_CREATOR'
  | 'OBSERVER'
  | 'VENDOR'
  | 'CLIENT';

export type PermissionModule =
  | 'dashboard'
  | 'auction'
  | 'vendor'
  | 'contract'
  | 'financial'
  | 'system'
  | 'integrations';

export interface Permission {
  key: string;
  module: PermissionModule;
  action: string;
  granted: boolean;
  inherited: boolean;
  inheritedFrom?: string;
}

export interface AccessControls {
  dataScope: 'own' | 'team' | 'all';
  regions: string[];
  timeRestriction: {
    enabled: boolean;
    mode: '24x7' | 'business' | 'custom';
    startHour?: number;
    endHour?: number;
    days?: number[];
  };
  ipRestriction: {
    enabled: boolean;
    mode: 'any' | 'office' | 'vpn';
    whitelistedIPs: string[];
  };
}

export interface RoleRecord {
  roleId: string;
  roleName: string;
  roleKey: RoleKey;
  color: string;
  icon: string;
  roleType: 'system' | 'custom';
  description: string;
  status: 'active' | 'inactive';
  permissions: Permission[];
  accessControls: AccessControls;
  sessionSettings: {
    maxConcurrentSessions: number;
    sessionTimeout: number;
    requireReauth: boolean;
  };
  securitySettings: {
    require2FA: boolean;
    allowed2FAMethods: Array<'sms' | 'authenticator'>;
    graceDays: number;
  };
  hierarchy: {
    parentRoleId?: string;
    childRoleIds: string[];
    level: number;
  };
  createdBy: string;
  createdAt: number;
  lastModifiedBy: string;
  lastModifiedAt: number;
}

export interface UserRecord {
  userId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  reportingTo?: string;
  roleId: string;
  roleName: string;
  roleColor: string;
  status: 'active' | 'inactive' | 'pending';
  customPermissions: Array<{
    permission: string;
    granted: boolean;
    grantedBy: string;
    grantedAt: number;
    expiresAt?: number;
    reason: string;
  }>;
  sessions: SessionRecord[];
  securitySettings: {
    twoFactorEnabled: boolean;
    twoFactorMethod: 'sms' | 'authenticator' | 'none';
    lastPasswordChange: number;
    failedLoginAttempts: number;
    accountLockedUntil?: number;
  };
  auditLog: AuditEvent[];
  lastActiveAt: number;
}

export interface SessionRecord {
  sessionId: string;
  userId: string;
  roleName: string;
  roleColor: string;
  status: 'active' | 'idle' | 'expired';
  deviceInfo: string;
  ipAddress: string;
  location: string;
  loginAt: number;
  lastActivityAt: number;
  expiresAt: number;
}

export interface PermissionRequestRecord {
  requestId: string;
  requestedBy: string;
  requestedByName: string;
  currentRole: string;
  permissionRequested: string;
  permissionType: 'single' | 'role_upgrade';
  justification: string;
  urgency: 'urgent' | 'high' | 'medium' | 'low';
  duration: 'permanent' | 'temporary';
  temporaryDays?: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: number;
  reviewNotes?: string;
  requestedAt: number;
  expiresAt: number;
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  user: string;
  role: string;
  action:
    | 'PERMISSION_GRANTED'
    | 'PERMISSION_REVOKED'
    | 'ROLE_CHANGED'
    | 'ACCESS_DENIED'
    | 'LOGIN'
    | 'LOGOUT'
    | 'ROLE_CREATED'
    | 'ROLE_UPDATED'
    | 'REQUEST_CREATED'
    | 'REQUEST_APPROVED'
    | 'REQUEST_REJECTED';
  resource: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILED';
  details: string;
}

const ALL_PERMISSIONS: Array<{ key: string; module: PermissionModule; action: string }> = [
  { key: 'dashboard.view.executive', module: 'dashboard', action: 'view_executive' },
  { key: 'dashboard.view.vendor_scorecard', module: 'dashboard', action: 'view_vendor_scorecard' },
  { key: 'dashboard.view.analytics', module: 'dashboard', action: 'view_analytics' },
  { key: 'dashboard.export', module: 'dashboard', action: 'export_reports' },
  { key: 'dashboard.configure', module: 'dashboard', action: 'configure_dashboards' },

  { key: 'auction.view', module: 'auction', action: 'view' },
  { key: 'auction.create', module: 'auction', action: 'create' },
  { key: 'auction.edit', module: 'auction', action: 'edit' },
  { key: 'auction.delete', module: 'auction', action: 'delete' },
  { key: 'auction.pause_resume', module: 'auction', action: 'pause_resume' },
  { key: 'auction.extend_lanes', module: 'auction', action: 'extend_lanes' },
  { key: 'auction.end_early', module: 'auction', action: 'end_early' },
  { key: 'auction.live_monitor', module: 'auction', action: 'live_monitor' },
  { key: 'auction.emergency_controls', module: 'auction', action: 'emergency_controls' },

  { key: 'vendor.view', module: 'vendor', action: 'view' },
  { key: 'vendor.approve_reject', module: 'vendor', action: 'approve_reject' },
  { key: 'vendor.edit', module: 'vendor', action: 'edit' },
  { key: 'vendor.block_unblock', module: 'vendor', action: 'block_unblock' },
  { key: 'vendor.delete', module: 'vendor', action: 'delete' },
  { key: 'vendor.performance_view', module: 'vendor', action: 'performance_view' },
  { key: 'vendor.message', module: 'vendor', action: 'message' },

  { key: 'contract.view', module: 'contract', action: 'view' },
  { key: 'contract.create', module: 'contract', action: 'create' },
  { key: 'contract.edit', module: 'contract', action: 'edit' },
  { key: 'contract.delete', module: 'contract', action: 'delete' },
  { key: 'contract.send_signature', module: 'contract', action: 'send_signature' },
  { key: 'contract.download', module: 'contract', action: 'download' },

  { key: 'financial.view_reports', module: 'financial', action: 'view_reports' },
  { key: 'financial.view_savings', module: 'financial', action: 'view_savings' },
  { key: 'financial.modify_data', module: 'financial', action: 'modify_data' },
  { key: 'financial.export', module: 'financial', action: 'export_reports' },
  { key: 'financial.view_payments', module: 'financial', action: 'view_payments' },

  { key: 'system.manage_users', module: 'system', action: 'manage_users' },
  { key: 'system.manage_roles', module: 'system', action: 'manage_roles' },
  { key: 'system.audit_view', module: 'system', action: 'audit_view' },
  { key: 'system.configuration', module: 'system', action: 'configuration' },
  { key: 'system.backup_restore', module: 'system', action: 'backup_restore' },

  { key: 'integrations.view', module: 'integrations', action: 'view' },
  { key: 'integrations.configure_api', module: 'integrations', action: 'configure_api' },
  { key: 'integrations.manage_webhooks', module: 'integrations', action: 'manage_webhooks' },
];

function now() { return Date.now(); }
function randId(prefix: string) { return `${prefix}-${Math.random().toString(36).slice(2, 10)}`; }

function permissionSet(keys: string[], inherited = false, inheritedFrom?: string): Permission[] {
  return ALL_PERMISSIONS.map((p) => ({
    ...p,
    granted: keys.includes(p.key),
    inherited,
    inheritedFrom,
  }));
}

class RbacService {
  private roles = new Map<string, RoleRecord>();
  private users = new Map<string, UserRecord>();
  private permissionRequests = new Map<string, PermissionRequestRecord>();
  private auditLog: AuditEvent[] = [];
  private subscribers = new Set<() => void>();

  constructor() {
    this.seed();
    setInterval(() => this.tick(), 30_000);
  }

  subscribe(cb: () => void) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  private log(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
    this.auditLog.unshift({ id: randId('AUD'), timestamp: now(), ...event });
  }

  getSnapshot() {
    return {
      roles: Array.from(this.roles.values()),
      users: Array.from(this.users.values()),
      permissionRequests: Array.from(this.permissionRequests.values()).sort((a, b) => b.requestedAt - a.requestedAt),
      auditLog: this.auditLog,
    };
  }

  getRole(roleId: string) { return this.roles.get(roleId); }
  getUser(userId: string) { return this.users.get(userId); }

  getUsersByRole(roleId: string) {
    return Array.from(this.users.values()).filter((u) => u.roleId === roleId);
  }

  createRole(input: Omit<RoleRecord, 'roleId' | 'createdAt' | 'lastModifiedAt' | 'hierarchy' | 'permissions'> & {
    permissionKeys: string[];
    parentRoleId?: string;
  }) {
    const roleId = randId('ROLE');
    const parent = input.parentRoleId ? this.roles.get(input.parentRoleId) : undefined;
    const role: RoleRecord = {
      roleId,
      roleName: input.roleName,
      roleKey: input.roleKey,
      color: input.color,
      icon: input.icon,
      roleType: input.roleType,
      description: input.description,
      status: input.status,
      permissions: permissionSet(input.permissionKeys, false),
      accessControls: input.accessControls,
      sessionSettings: input.sessionSettings,
      securitySettings: input.securitySettings,
      hierarchy: {
        parentRoleId: parent?.roleId,
        childRoleIds: [],
        level: parent ? parent.hierarchy.level + 1 : 1,
      },
      createdBy: input.createdBy,
      createdAt: now(),
      lastModifiedBy: input.lastModifiedBy,
      lastModifiedAt: now(),
    };

    this.roles.set(roleId, role);
    if (parent) {
      parent.hierarchy.childRoleIds.push(roleId);
      parent.lastModifiedAt = now();
    }

    this.log({
      user: input.createdBy,
      role: 'SYSTEM',
      action: 'ROLE_CREATED',
      resource: role.roleName,
      ipAddress: '192.168.1.10',
      status: 'SUCCESS',
      details: `Created role ${role.roleName}`,
    });
    this.notify();
    return roleId;
  }

  updateRole(roleId: string, updates: Partial<Pick<RoleRecord, 'roleName' | 'description' | 'color' | 'icon' | 'status' | 'accessControls' | 'sessionSettings' | 'securitySettings'>> & { permissionKeys?: string[]; modifiedBy: string; }) {
    const role = this.roles.get(roleId);
    if (!role) throw new Error('Role not found');
    if (role.roleType === 'system' && (updates.roleName || updates.description || updates.color)) {
      // Allow only permission/security updates for system role in mock.
    }

    if (updates.roleName) role.roleName = updates.roleName;
    if (updates.description) role.description = updates.description;
    if (updates.color) role.color = updates.color;
    if (updates.icon) role.icon = updates.icon;
    if (updates.status) role.status = updates.status;
    if (updates.accessControls) role.accessControls = updates.accessControls;
    if (updates.sessionSettings) role.sessionSettings = updates.sessionSettings;
    if (updates.securitySettings) role.securitySettings = updates.securitySettings;
    if (updates.permissionKeys) role.permissions = permissionSet(updates.permissionKeys);

    role.lastModifiedBy = updates.modifiedBy;
    role.lastModifiedAt = now();

    this.log({
      user: updates.modifiedBy,
      role: role.roleName,
      action: 'ROLE_UPDATED',
      resource: role.roleName,
      ipAddress: '192.168.1.10',
      status: 'SUCCESS',
      details: `Updated role ${role.roleName}`,
    });
    this.notify();
  }

  createUser(input: {
    name: string;
    email: string;
    phone: string;
    roleId: string;
    department: string;
    reportingTo?: string;
    createdBy: string;
    status: 'active' | 'inactive' | 'pending';
  }) {
    const role = this.roles.get(input.roleId);
    if (!role) throw new Error('Role not found');
    const userId = randId('USR');
    const user: UserRecord = {
      userId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      department: input.department,
      reportingTo: input.reportingTo,
      roleId: role.roleId,
      roleName: role.roleName,
      roleColor: role.color,
      status: input.status,
      customPermissions: [],
      sessions: [],
      securitySettings: {
        twoFactorEnabled: role.securitySettings.require2FA,
        twoFactorMethod: role.securitySettings.require2FA ? 'authenticator' : 'none',
        lastPasswordChange: now(),
        failedLoginAttempts: 0,
      },
      auditLog: [],
      lastActiveAt: now(),
    };

    this.users.set(userId, user);
    this.log({
      user: input.createdBy,
      role: role.roleName,
      action: 'ROLE_CHANGED',
      resource: `${user.name} assigned ${role.roleName}`,
      ipAddress: '192.168.1.11',
      status: 'SUCCESS',
      details: `Created user ${user.email}`,
    });
    this.notify();
    return userId;
  }

  changeUserRole(userId: string, newRoleId: string, by: string) {
    const user = this.users.get(userId);
    const role = this.roles.get(newRoleId);
    if (!user || !role) throw new Error('User/Role not found');

    const oldRole = user.roleName;
    user.roleId = role.roleId;
    user.roleName = role.roleName;
    user.roleColor = role.color;
    user.lastActiveAt = now();

    this.log({
      user: by,
      role: role.roleName,
      action: 'ROLE_CHANGED',
      resource: user.email,
      ipAddress: '192.168.1.12',
      status: 'SUCCESS',
      details: `Role changed from ${oldRole} to ${role.roleName}`,
    });
    this.notify();
  }

  grantCustomPermission(userId: string, permission: string, granted: boolean, by: string, reason: string, expiresAt?: number) {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    user.customPermissions.unshift({ permission, granted, grantedBy: by, grantedAt: now(), expiresAt, reason });

    this.log({
      user: by,
      role: user.roleName,
      action: granted ? 'PERMISSION_GRANTED' : 'PERMISSION_REVOKED',
      resource: `${user.email} -> ${permission}`,
      ipAddress: '192.168.1.13',
      status: 'SUCCESS',
      details: reason,
    });
    this.notify();
  }

  getEffectivePermissions(userId: string) {
    const user = this.users.get(userId);
    if (!user) return [] as Permission[];
    const role = this.roles.get(user.roleId);
    if (!role) return [] as Permission[];

    const base = role.permissions.map((p) => ({ ...p }));
    const nowTs = now();
    user.customPermissions.forEach((cp) => {
      if (cp.expiresAt && cp.expiresAt < nowTs) return;
      const match = base.find((p) => p.key === cp.permission);
      if (match) {
        match.granted = cp.granted;
      } else {
        const pDef = ALL_PERMISSIONS.find((p) => p.key === cp.permission);
        if (pDef) base.push({ ...pDef, granted: cp.granted, inherited: false });
      }
    });

    return base;
  }

  checkPermission(userId: string, permissionKey: string) {
    const user = this.users.get(userId);
    if (!user) {
      return { allowed: false, reason: 'User not found', required: permissionKey };
    }
    const perms = this.getEffectivePermissions(userId);
    const p = perms.find((x) => x.key === permissionKey);
    const allowed = Boolean(p?.granted);

    if (!allowed) {
      this.log({
        user: user.name,
        role: user.roleName,
        action: 'ACCESS_DENIED',
        resource: permissionKey,
        ipAddress: '192.168.1.14',
        status: 'FAILED',
        details: `Missing permission ${permissionKey}`,
      });
    }

    return {
      allowed,
      reason: allowed ? 'OK' : 'Insufficient permissions',
      required: permissionKey,
      userRole: user.roleName,
      message: allowed ? 'Allowed' : 'Contact admin for access',
    };
  }

  createPermissionRequest(input: {
    requestedBy: string;
    permissionRequested: string;
    permissionType: 'single' | 'role_upgrade';
    justification: string;
    urgency: 'urgent' | 'high' | 'medium' | 'low';
    duration: 'permanent' | 'temporary';
    temporaryDays?: number;
  }) {
    const user = this.users.get(input.requestedBy);
    if (!user) throw new Error('User not found');
    const requestId = randId('REQ');

    const req: PermissionRequestRecord = {
      requestId,
      requestedBy: input.requestedBy,
      requestedByName: user.name,
      currentRole: user.roleName,
      permissionRequested: input.permissionRequested,
      permissionType: input.permissionType,
      justification: input.justification,
      urgency: input.urgency,
      duration: input.duration,
      temporaryDays: input.temporaryDays,
      status: 'pending',
      requestedAt: now(),
      expiresAt: now() + 7 * 24 * 60 * 60 * 1000,
    };

    this.permissionRequests.set(requestId, req);
    this.log({
      user: user.name,
      role: user.roleName,
      action: 'REQUEST_CREATED',
      resource: req.permissionRequested,
      ipAddress: '192.168.1.15',
      status: 'SUCCESS',
      details: req.justification,
    });
    this.notify();
    return requestId;
  }

  reviewPermissionRequest(requestId: string, byUserId: string, decision: 'approve' | 'reject', notes: string) {
    const req = this.permissionRequests.get(requestId);
    const reviewer = this.users.get(byUserId);
    if (!req || !reviewer) throw new Error('Request/reviewer not found');

    req.reviewedBy = reviewer.name;
    req.reviewedAt = now();
    req.reviewNotes = notes;
    req.status = decision === 'approve' ? 'approved' : 'rejected';

    if (decision === 'approve') {
      this.grantCustomPermission(
        req.requestedBy,
        req.permissionRequested,
        true,
        reviewer.name,
        notes || 'Approved from request workflow',
        req.duration === 'temporary' && req.temporaryDays ? now() + req.temporaryDays * 24 * 60 * 60 * 1000 : undefined,
      );
    }

    this.log({
      user: reviewer.name,
      role: reviewer.roleName,
      action: decision === 'approve' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
      resource: req.permissionRequested,
      ipAddress: '192.168.1.16',
      status: 'SUCCESS',
      details: notes,
    });
    this.notify();
  }

  startSession(userId: string, meta: { deviceInfo: string; ipAddress: string; location: string }) {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    const role = this.roles.get(user.roleId);
    if (!role) throw new Error('Role not found');

    const activeSessions = user.sessions.filter((s) => s.status === 'active' || s.status === 'idle');
    if (activeSessions.length >= role.sessionSettings.maxConcurrentSessions) {
      // expire oldest
      const oldest = activeSessions.sort((a, b) => a.loginAt - b.loginAt)[0];
      oldest.status = 'expired';
    }

    const session: SessionRecord = {
      sessionId: randId('SES'),
      userId,
      roleName: user.roleName,
      roleColor: user.roleColor,
      status: 'active',
      deviceInfo: meta.deviceInfo,
      ipAddress: meta.ipAddress,
      location: meta.location,
      loginAt: now(),
      lastActivityAt: now(),
      expiresAt: now() + role.sessionSettings.sessionTimeout * 60 * 1000,
    };

    user.sessions.unshift(session);
    user.lastActiveAt = now();

    this.log({
      user: user.name,
      role: user.roleName,
      action: 'LOGIN',
      resource: session.sessionId,
      ipAddress: meta.ipAddress,
      status: 'SUCCESS',
      details: `${meta.deviceInfo} @ ${meta.location}`,
    });
    this.notify();
    return session.sessionId;
  }

  touchSession(sessionId: string) {
    const user = Array.from(this.users.values()).find((u) => u.sessions.some((s) => s.sessionId === sessionId));
    if (!user) return;
    const role = this.roles.get(user.roleId);
    if (!role) return;
    const s = user.sessions.find((x) => x.sessionId === sessionId);
    if (!s || s.status === 'expired') return;
    s.lastActivityAt = now();
    s.expiresAt = now() + role.sessionSettings.sessionTimeout * 60 * 1000;
    s.status = 'active';
    user.lastActiveAt = now();
    this.notify();
  }

  terminateSession(sessionId: string, by: string) {
    const user = Array.from(this.users.values()).find((u) => u.sessions.some((s) => s.sessionId === sessionId));
    if (!user) return;
    const s = user.sessions.find((x) => x.sessionId === sessionId);
    if (!s) return;
    s.status = 'expired';

    this.log({
      user: by,
      role: user.roleName,
      action: 'LOGOUT',
      resource: sessionId,
      ipAddress: s.ipAddress,
      status: 'SUCCESS',
      details: 'Session terminated by admin',
    });
    this.notify();
  }

  terminateAllUserSessions(userId: string, by: string) {
    const user = this.users.get(userId);
    if (!user) return;
    user.sessions.forEach((s) => { s.status = 'expired'; });
    this.log({
      user: by,
      role: user.roleName,
      action: 'LOGOUT',
      resource: user.email,
      ipAddress: '192.168.1.17',
      status: 'SUCCESS',
      details: 'All sessions terminated',
    });
    this.notify();
  }

  private tick() {
    const nowTs = now();
    let changed = false;

    this.users.forEach((user) => {
      user.customPermissions = user.customPermissions.filter((cp) => !cp.expiresAt || cp.expiresAt > nowTs);

      user.sessions.forEach((s) => {
        if (s.status === 'expired') return;
        if (s.expiresAt <= nowTs) {
          s.status = 'expired';
          changed = true;
          this.log({
            user: user.name,
            role: user.roleName,
            action: 'LOGOUT',
            resource: s.sessionId,
            ipAddress: s.ipAddress,
            status: 'SUCCESS',
            details: 'Session expired by timeout',
          });
        } else if (nowTs - s.lastActivityAt > 10 * 60 * 1000) {
          s.status = 'idle';
        } else {
          s.status = 'active';
        }
      });
    });

    this.permissionRequests.forEach((req) => {
      if (req.status === 'pending' && req.expiresAt < nowTs) {
        req.status = 'rejected';
        req.reviewNotes = 'Auto-expired';
        changed = true;
      }
    });

    if (changed) this.notify();
  }

  private seed() {
    const makeRole = (
      roleId: string,
      roleKey: RoleKey,
      roleName: string,
      color: string,
      icon: string,
      type: 'system' | 'custom',
      desc: string,
      permissionKeys: string[],
      level: number,
      parentRoleId?: string,
      require2FA: boolean = false,
      methods: Array<'sms' | 'authenticator'> = ['sms'],
      graceDays = 7,
    ): RoleRecord => ({
      roleId,
      roleName,
      roleKey,
      color,
      icon,
      roleType: type,
      description: desc,
      status: 'active',
      permissions: permissionSet(permissionKeys),
      accessControls: {
        dataScope: level <= 2 ? 'all' : level <= 3 ? 'team' : 'own',
        regions: ['North', 'South', 'East', 'West'],
        timeRestriction: { enabled: false, mode: '24x7' },
        ipRestriction: { enabled: false, mode: 'any', whitelistedIPs: [] },
      },
      sessionSettings: {
        maxConcurrentSessions: level <= 2 ? 3 : 2,
        sessionTimeout: level <= 2 ? 90 : 60,
        requireReauth: level <= 2,
      },
      securitySettings: {
        require2FA,
        allowed2FAMethods: methods,
        graceDays,
      },
      hierarchy: {
        parentRoleId,
        childRoleIds: [],
        level,
      },
      createdBy: 'SYSTEM',
      createdAt: now(),
      lastModifiedBy: 'SYSTEM',
      lastModifiedAt: now(),
    });

    const all = ALL_PERMISSIONS.map((p) => p.key);
    const admin = all.filter((k) => k !== 'system.backup_restore' && k !== 'auction.emergency_controls');
    const manager = all.filter((k) => !k.startsWith('system.') && k !== 'financial.modify_data' && k !== 'auction.delete' && k !== 'contract.delete');
    const creator = all.filter((k) => [
      'dashboard.view.executive', 'dashboard.view.vendor_scorecard', 'dashboard.view.analytics',
      'auction.view', 'auction.create', 'auction.edit', 'auction.pause_resume', 'auction.extend_lanes', 'auction.live_monitor',
      'vendor.view', 'vendor.performance_view',
      'contract.view', 'contract.download',
      'financial.view_savings', 'financial.view_reports',
      'integrations.view',
    ].includes(k));
    const viewer = all.filter((k) => k.includes('.view') || k === 'dashboard.export' || k === 'financial.export');
    const vendor = ['auction.view', 'contract.view', 'contract.download'];
    const client = ['dashboard.view.executive', 'dashboard.view.analytics', 'auction.view', 'contract.view', 'financial.view_reports'];

    const superAdminRole = makeRole('ROLE-SUPER', 'SUPER_ADMIN', 'SUPER ADMIN', ROLE_COLORS.superAdmin, '👑', 'system', 'Complete system control with all permissions', all, 1, undefined, true, ['sms', 'authenticator'], 0);
    const adminRole = makeRole('ROLE-ADMIN', 'ADMIN', 'ADMIN', ROLE_COLORS.admin, '⚙️', 'system', 'Can manage auctions, vendors, contracts', admin, 2, 'ROLE-SUPER', true, ['sms', 'authenticator'], 0);
    const managerRole = makeRole('ROLE-MANAGER', 'PROCUREMENT_MANAGER', 'PROCUREMENT MANAGER', ROLE_COLORS.manager, '📊', 'custom', 'Create auctions, monitor performance, manage vendors', manager, 3, 'ROLE-ADMIN', false, ['sms', 'authenticator'], 7);
    const creatorRole = makeRole('ROLE-CREATOR', 'AUCTION_CREATOR', 'AUCTION CREATOR', ROLE_COLORS.user, '🎯', 'custom', 'Create and manage auctions only', creator, 4, 'ROLE-MANAGER');
    const observerRole = makeRole('ROLE-OBSERVER', 'OBSERVER', 'OBSERVER', ROLE_COLORS.viewer, '👁️', 'custom', 'View-only access to dashboards and reports', viewer, 2, 'ROLE-SUPER');
    const vendorRole = makeRole('ROLE-VENDOR', 'VENDOR', 'VENDOR', ROLE_COLORS.vendor, '🚚', 'system', 'Access to vendor portal, bidding, contracts', vendor, 4, 'ROLE-MANAGER');
    const clientRole = makeRole('ROLE-CLIENT', 'CLIENT', 'CLIENT', ROLE_COLORS.client, '🧳', 'system', 'Access for client stakeholders', client, 4, 'ROLE-MANAGER');

    this.roles.set(superAdminRole.roleId, superAdminRole);
    this.roles.set(adminRole.roleId, adminRole);
    this.roles.set(managerRole.roleId, managerRole);
    this.roles.set(creatorRole.roleId, creatorRole);
    this.roles.set(observerRole.roleId, observerRole);
    this.roles.set(vendorRole.roleId, vendorRole);
    this.roles.set(clientRole.roleId, clientRole);

    superAdminRole.hierarchy.childRoleIds.push('ROLE-ADMIN', 'ROLE-OBSERVER');
    adminRole.hierarchy.childRoleIds.push('ROLE-MANAGER');
    managerRole.hierarchy.childRoleIds.push('ROLE-CREATOR', 'ROLE-VENDOR', 'ROLE-CLIENT');

    const seedUsers = [
      { id: 'USR-SUPER-1', name: 'Sanjay Mehta', email: 'sanjay@optimile.com', role: 'ROLE-SUPER', dept: 'Leadership' },
      { id: 'USR-SUPER-2', name: 'Aarti Gupta', email: 'aarti@optimile.com', role: 'ROLE-SUPER', dept: 'Security' },
      { id: 'USR-ADM-1', name: 'Priya Sharma', email: 'priya@optimile.com', role: 'ROLE-ADMIN', dept: 'Operations' },
      { id: 'USR-ADM-2', name: 'Rohit Jain', email: 'rohit@optimile.com', role: 'ROLE-ADMIN', dept: 'Operations' },
      { id: 'USR-MGR-1', name: 'Rajesh Kumar', email: 'rajesh@optimile.com', role: 'ROLE-MANAGER', dept: 'Procurement' },
      { id: 'USR-MGR-2', name: 'Neha Iyer', email: 'neha@optimile.com', role: 'ROLE-MANAGER', dept: 'Procurement' },
      { id: 'USR-MGR-3', name: 'Amit Patel', email: 'amit@optimile.com', role: 'ROLE-MANAGER', dept: 'Procurement' },
      { id: 'USR-CRT-1', name: 'Dev Singh', email: 'dev@optimile.com', role: 'ROLE-CREATOR', dept: 'Auction Ops' },
      { id: 'USR-OBS-1', name: 'Kiran Das', email: 'kiran@optimile.com', role: 'ROLE-OBSERVER', dept: 'Finance' },
      { id: 'USR-OBS-2', name: 'Monica Roy', email: 'monica@optimile.com', role: 'ROLE-OBSERVER', dept: 'Finance' },
      { id: 'USR-VEN-1', name: 'Vendor User A', email: 'vendor-a@partner.com', role: 'ROLE-VENDOR', dept: 'External' },
      { id: 'USR-CLI-1', name: 'Client User A', email: 'client-a@shipper.com', role: 'ROLE-CLIENT', dept: 'External' },
    ];

    seedUsers.forEach((u, idx) => {
      const role = this.roles.get(u.role)!;
      const status: UserRecord['status'] = idx % 9 === 0 ? 'pending' : idx % 7 === 0 ? 'inactive' : 'active';
      const user: UserRecord = {
        userId: u.id,
        name: u.name,
        email: u.email,
        phone: `+919800000${String(idx).padStart(3, '0')}`,
        department: u.dept,
        roleId: role.roleId,
        roleName: role.roleName,
        roleColor: role.color,
        status,
        customPermissions: [],
        sessions: [],
        securitySettings: {
          twoFactorEnabled: role.securitySettings.require2FA || idx % 2 === 0,
          twoFactorMethod: role.securitySettings.require2FA ? 'authenticator' : 'sms',
          lastPasswordChange: now() - idx * 3 * 24 * 60 * 60 * 1000,
          failedLoginAttempts: idx % 5 === 0 ? 2 : 0,
        },
        auditLog: [],
        lastActiveAt: now() - idx * 60 * 60 * 1000,
      };
      this.users.set(user.userId, user);

      if (status === 'active' && idx % 2 === 0) {
        this.startSession(user.userId, {
          deviceInfo: idx % 3 === 0 ? 'Chrome on Windows' : 'Safari on MacBook',
          ipAddress: `192.168.1.${40 + idx}`,
          location: idx % 3 === 0 ? 'Mumbai, India' : idx % 3 === 1 ? 'Bengaluru, India' : 'Delhi, India',
        });
      }
    });

    // Sample permission requests
    this.createPermissionRequest({
      requestedBy: 'USR-OBS-1',
      permissionRequested: 'auction.delete',
      permissionType: 'single',
      justification: 'Need to clean up test auctions created during UAT',
      urgency: 'urgent',
      duration: 'permanent',
    });
    this.createPermissionRequest({
      requestedBy: 'USR-CRT-1',
      permissionRequested: 'financial.view_reports',
      permissionType: 'single',
      justification: 'Need cost data for bid strategy review',
      urgency: 'medium',
      duration: 'temporary',
      temporaryDays: 7,
    });

    // Sample denied event for security monitoring
    this.checkPermission('USR-OBS-1', 'auction.delete');
  }
}

export const rbacService = new RbacService();
export const RBAC_PERMISSION_CATALOG = ALL_PERMISSIONS;
