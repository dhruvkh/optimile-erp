import { 
  AuctionTemplate, 
  AuctionType, 
  TemplateCategory, 
  TemplateVisibility,
  CreateAuctionRequest,
} from '../types';

// Generate unique template ID
export function generateTemplateId(): string {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TMPL-${timestamp}-${random}`;
}

// Generate shareable template token
export function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Format template name for display
export function getTemplateDisplayName(template: AuctionTemplate): string {
  return template.templateName;
}

// Get template type badge color
export function getTemplateTypeColor(auctionType: AuctionType): string {
  const colorMap: Record<AuctionType, string> = {
    REVERSE: 'bg-blue-100 text-blue-800',
    SPOT: 'bg-red-100 text-red-800',
    LOT: 'bg-green-100 text-green-800',
    BULK: 'bg-purple-100 text-purple-800',
    REGION_LOT: 'bg-orange-100 text-orange-800',
  };
  return colorMap[auctionType] || 'bg-gray-100 text-gray-800';
}

// Get category badge
export function getCategoryBadge(category: TemplateCategory): string {
  const badgeMap: Record<TemplateCategory, string> = {
    FTL: 'FTL',
    LTL: 'LTL',
    Spot: 'Spot',
    Regional: 'Regional',
    Other: 'Other',
  };
  return badgeMap[category];
}

// Format last used date
export function formatLastUsed(timestamp?: number): string {
  if (!timestamp) return 'Never used';
  
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  
  const years = Math.floor(diffDays / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

// Validate template name
export function validateTemplateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Template name is required' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Template name cannot exceed 100 characters' };
  }
  return { valid: true };
}

// Validate template description
export function validateTemplateDescription(description?: string): { valid: boolean; error?: string } {
  if (description && description.length > 200) {
    return { valid: false, error: 'Description cannot exceed 200 characters' };
  }
  return { valid: true };
}

// Validate entire template
export function validateTemplate(template: Partial<AuctionTemplate>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!template.templateName || template.templateName.trim().length === 0) {
    errors.push('Template name is required');
  } else if (template.templateName.length > 100) {
    errors.push('Template name cannot exceed 100 characters');
  }
  
  if (template.description && template.description.length > 200) {
    errors.push('Description cannot exceed 200 characters');
  }
  
  if (!template.category) {
    errors.push('Category is required');
  }
  
  if (!template.auctionConfiguration) {
    errors.push('Auction configuration is required');
  } else {
    if (!template.auctionConfiguration.auctionType) {
      errors.push('Auction type is required');
    }
    if (!template.auctionConfiguration.lanes || template.auctionConfiguration.lanes.length === 0) {
      errors.push('At least one lane is required');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Filter templates by type
export function filterTemplatesByType(
  templates: AuctionTemplate[],
  auctionType?: AuctionType
): AuctionTemplate[] {
  if (!auctionType) return templates;
  return templates.filter(t => t.auctionConfiguration.auctionType === auctionType);
}

// Filter templates by creator
export function filterTemplatesByCreator(
  templates: AuctionTemplate[],
  createdBy?: string,
  showSystem: boolean = true
): AuctionTemplate[] {
  return templates.filter(t => {
    if (!showSystem && t.isSystemTemplate) return false;
    if (createdBy && !t.isSystemTemplate && t.createdBy !== createdBy) return false;
    return true;
  });
}

// Filter templates by visibility
export function filterTemplatesByVisibility(
  templates: AuctionTemplate[],
  visibility: TemplateVisibility | 'all' = 'all'
): AuctionTemplate[] {
  if (visibility === 'all') return templates;
  return templates.filter(t => t.visibility === visibility);
}

// Search templates by name
export function searchTemplates(
  templates: AuctionTemplate[],
  query: string
): AuctionTemplate[] {
  if (!query.trim()) return templates;
  const lowerQuery = query.toLowerCase();
  return templates.filter(t => 
    t.templateName.toLowerCase().includes(lowerQuery) ||
    (t.description && t.description.toLowerCase().includes(lowerQuery))
  );
}

// Get favorite templates
export function getFavoriteTemplates(templates: AuctionTemplate[]): AuctionTemplate[] {
  return templates.filter(t => t.isFavorite);
}

// Sort templates
export type TemplateSortOption = 'recentlyUsed' | 'mostUsed' | 'alphabetical' | 'dateCreated';

export function sortTemplates(
  templates: AuctionTemplate[],
  sortBy: TemplateSortOption = 'recentlyUsed'
): AuctionTemplate[] {
  const sorted = [...templates];
  
  switch (sortBy) {
    case 'recentlyUsed':
      return sorted.sort((a, b) => {
        const aTime = a.lastUsedAt || 0;
        const bTime = b.lastUsedAt || 0;
        return bTime - aTime;
      });
    
    case 'mostUsed':
      return sorted.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    
    case 'alphabetical':
      return sorted.sort((a, b) => a.templateName.localeCompare(b.templateName));
    
    case 'dateCreated':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    
    default:
      return sorted;
  }
}

// Convert template to CreateAuctionRequest
export function templateToCreateAuctionRequest(
  template: AuctionTemplate,
  auctionName: string,
  userId: string
): CreateAuctionRequest {
  return {
    name: auctionName,
    auctionType: template.auctionConfiguration.auctionType,
    clientId: 'default-client', // Should be passed in
    createdBy: userId,
    ruleset: template.auctionConfiguration.globalRuleset,
    lanes: template.auctionConfiguration.lanes.map((lane, idx) => ({
      laneName: lane.laneName,
      sequenceOrder: idx + 1,
      basePrice: lane.basePrice,
      minBidDecrement: lane.decrement,
      timerDurationSeconds: lane.duration,
      tatDays: lane.tatDays,
    })),
  };
}

// Generate default auction name from template
export function generateAuctionNameFromTemplate(
  templateName: string,
  useCopy: boolean = false
): string {
  if (useCopy) {
    return `${templateName} - Copy`;
  }
  const today = new Date().toISOString().split('T')[0];
  return `${templateName} - ${today}`;
}

// Get template statistics summary
export function getTemplateStatisticsSummary(template: AuctionTemplate): {
  timesUsed: number;
  averageSavings: string;
  mostUsedBy: string;
} {
  return {
    timesUsed: template.usageCount || 0,
    averageSavings: template.averageSavingsPercent 
      ? `${template.averageSavingsPercent.toFixed(1)}%` 
      : 'N/A',
    mostUsedBy: template.mostUsedBy || 'N/A',
  };
}

// Duplicate template with new name
export function duplicateTemplate(
  template: AuctionTemplate,
  userId: string
): Omit<AuctionTemplate, 'templateId'> {
  return {
    templateName: `${template.templateName} - Copy`,
    description: template.description,
    category: template.category,
    isSystemTemplate: false, // Custom copy is never a system template
    visibility: template.visibility,
    isFavorite: false,
    auctionConfiguration: {
      auctionType: template.auctionConfiguration.auctionType,
      globalRuleset: { ...template.auctionConfiguration.globalRuleset },
      lanes: template.auctionConfiguration.lanes.map(lane => ({ ...lane })),
    },
    createdBy: userId,
    createdAt: Date.now(),
    lastModifiedAt: Date.now(),
    lastModifiedBy: userId,
    usageCount: 0,
    totalAuctionsCreated: 0,
  };
}

// Check if user can edit template
export function canEditTemplate(
  template: AuctionTemplate,
  userId: string
): boolean {
  // System templates are never editable
  if (template.isSystemTemplate) return false;
  // Only creator can edit
  return template.createdBy === userId;
}

// Check if user can delete template
export function canDeleteTemplate(
  template: AuctionTemplate,
  userId: string
): boolean {
  // System templates cannot be deleted
  if (template.isSystemTemplate) return false;
  // Only creator can delete
  return template.createdBy === userId;
}

// Check if user can share template
export function canShareTemplate(
  template: AuctionTemplate,
  userId: string
): boolean {
  // System templates cannot be shared (already public)
  if (template.isSystemTemplate) return false;
  // Only creator can share
  return template.createdBy === userId;
}

// Format template for display in list
export function formatTemplateForDisplay(template: AuctionTemplate) {
  return {
    id: template.templateId,
    name: template.templateName,
    description: template.description || 'No description',
    type: template.auctionConfiguration.auctionType,
    laneCount: template.auctionConfiguration.lanes.length,
    createdBy: template.isSystemTemplate ? 'System Template' : template.createdBy,
    lastUsed: formatLastUsed(template.lastUsedAt),
    usageCount: template.usageCount || 0,
    isFavorite: template.isFavorite,
    isSystem: template.isSystemTemplate,
    category: template.category,
  };
}
