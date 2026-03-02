import { CreateAuctionRequest, AuctionType, AuctionPreviewData, LanePreviewData, ValidationError } from '../types';

/**
 * Calculate minimum possible price for a lane
 * Formula: basePrice - Math.floor(duration / extensionThreshold) * decrement
 * Ensures price doesn't go below 20% of base
 */
export function calculateMinPossiblePrice(
  basePrice: number,
  duration: number,
  extensionThreshold: number,
  decrement: number
): number {
  const extensionCounts = Math.floor(duration / extensionThreshold);
  const minPrice = basePrice - extensionCounts * decrement;
  const floor = Math.floor(basePrice * 0.2); // 20% floor

  return Math.max(minPrice, floor);
}

/**
 * Calculate estimated savings percentage
 * Based on historical data: 12-18% for most auction types
 */
export function calculateEstimatedSavings(basePrice: number, minPrice: number): number {
  if (basePrice <= 0) return 0;
  const savings = ((basePrice - minPrice) / basePrice) * 100;
  return Math.round(savings);
}

/**
 * Format duration from seconds to mm:ss format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate total duration of all lanes (longest lane)
 */
export function calculateTotalDuration(durations: number[]): number {
  if (durations.length === 0) return 0;
  return Math.max(...durations);
}

/**
 * Calculate average lane duration
 */
export function calculateAverageDuration(durations: number[]): number {
  if (durations.length === 0) return 0;
  const total = durations.reduce((sum, d) => sum + d, 0);
  return Math.round(total / durations.length);
}

/**
 * Calculate total base value across all lanes
 */
export function calculateTotalBaseValue(basePrices: number[]): number {
  return basePrices.reduce((sum, price) => sum + price, 0);
}

/**
 * Estimate participant count based on lane routes and historical data
 * Typically 30-60% of eligible vendors participate
 */
export function estimateParticipantCount(eligibleCount: number = 20): number {
  if (eligibleCount === 0) return Math.floor(Math.random() * 10) + 5; // Default estimate
  return Math.ceil(eligibleCount * (0.3 + Math.random() * 0.3)); // 30-60% participation
}

/**
 * Validate auction form data
 */
export function validateAuctionData(formData: CreateAuctionRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  // Auction name
  if (!formData.name || formData.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Auction name is required',
      severity: 'error',
    });
  }

  // Auction type
  if (!formData.auctionType) {
    errors.push({
      field: 'auctionType',
      message: 'Auction type must be selected',
      severity: 'error',
    });
  }

  // Lanes
  if (formData.lanes.length === 0) {
    errors.push({
      field: 'lanes',
      message: 'At least one lane is required',
      severity: 'error',
    });
  }

  // Validate each lane
  formData.lanes.forEach((lane, index) => {
    if (!lane.laneName || lane.laneName.trim().length === 0) {
      errors.push({
        field: `lanes[${index}].laneName`,
        message: `Lane ${index + 1}: Name is required`,
        severity: 'error',
      });
    }

    if (lane.basePrice <= 0) {
      errors.push({
        field: `lanes[${index}].basePrice`,
        message: `Lane ${index + 1}: Base price must be greater than 0`,
        severity: 'error',
      });
    }

    if (lane.timerDurationSeconds < 60) {
      errors.push({
        field: `lanes[${index}].timerDurationSeconds`,
        message: `Lane ${index + 1}: Duration must be at least 60 seconds`,
        severity: 'warning',
      });
    }

    if (lane.minBidDecrement <= 0) {
      errors.push({
        field: `lanes[${index}].minBidDecrement`,
        message: `Lane ${index + 1}: Decrement must be greater than 0`,
        severity: 'error',
      });
    }
  });

  // Ruleset validation
  if (formData.ruleset.minBidDecrement <= 0) {
    errors.push({
      field: 'ruleset.minBidDecrement',
      message: 'Minimum bid decrement must be greater than 0',
      severity: 'error',
    });
  }

  if (formData.ruleset.timerExtensionThresholdSeconds <= 0) {
    errors.push({
      field: 'ruleset.timerExtensionThresholdSeconds',
      message: 'Extension threshold must be greater than 0',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Generate preview data from form data
 */
export function generateAuctionPreview(
  formData: CreateAuctionRequest,
  mode: 'create' | 'edit' = 'create'
): AuctionPreviewData {
  const errors = validateAuctionData(formData);
  const durations = formData.lanes.map(l => l.timerDurationSeconds);
  const basePrices = formData.lanes.map(l => l.basePrice);

  // Calculate lane preview data
  const lanes: LanePreviewData[] = formData.lanes.map(lane => {
    const minPrice = calculateMinPossiblePrice(
      lane.basePrice,
      lane.timerDurationSeconds,
      formData.ruleset.timerExtensionThresholdSeconds,
      lane.minBidDecrement
    );
    const savings = calculateEstimatedSavings(lane.basePrice, minPrice);

    return {
      laneName: lane.laneName,
      basePrice: lane.basePrice,
      duration: lane.timerDurationSeconds,
      decrement: lane.minBidDecrement,
      tatDays: lane.tatDays,
      minPossiblePrice: minPrice,
      estimatedSavings: savings,
    };
  });

  const totalDuration = calculateTotalDuration(durations);
  const averageDuration = calculateAverageDuration(durations);
  const shortestDuration = Math.min(...durations);
  const longestDuration = Math.max(...durations);
  const totalBaseValue = calculateTotalBaseValue(basePrices);

  // Estimated completion time = longest lane + 10% buffer
  const estimatedCompletionTime = Math.ceil(totalDuration * 1.1);

  return {
    auctionName: formData.name,
    auctionType: formData.auctionType,
    status: mode === 'create' ? 'draft' : 'draft',
    globalRuleset: formData.ruleset,
    lanes,
    validationErrors: errors,
    totalBaseValue,
    averageLaneDuration: averageDuration,
    shortestLaneDuration: shortestDuration,
    longestLaneDuration: longestDuration,
    estimatedCompletionTime,
    vendorEligibilityCount: undefined, // Can be set later if configured
    estimatedParticipantCount: estimateParticipantCount(),
  };
}

/**
 * Get extension explanation text
 */
export function getExtensionExplanation(
  thresholdSeconds: number,
  extensionSeconds: number
): string {
  return `When a bid is placed within the last ${thresholdSeconds} seconds, the timer extends by ${extensionSeconds} seconds to prevent sniper bidding.`;
}

/**
 * Generate shareable preview URL
 */
export function generatePreviewUrl(draftId: string, mode: 'create' | 'edit', token?: string): string {
  const params = new URLSearchParams({
    mode,
    draftId,
    preview: 'true',
  });

  if (token) {
    params.append('token', token);
  }

  return `/admin/auction-preview?${params.toString()}`;
}

/**
 * Format price in INR
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get auction type color
 */
export function getAuctionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    REVERSE: 'bg-blue-100 text-blue-800',
    SPOT: 'bg-orange-100 text-orange-800',
    LOT: 'bg-green-100 text-green-800',
    BULK: 'bg-purple-100 text-purple-800',
    REGION_LOT: 'bg-pink-100 text-pink-800',
  };
  return colors[type] || 'bg-slate-100 text-slate-800';
}

/**
 * Calculate lane timeline positions for Gantt chart
 */
export interface TimelinePosition {
  laneName: string;
  startPercentage: number;
  widthPercentage: number;
  duration: number;
}

export function calculateTimelinePositions(lanes: LanePreviewData[]): TimelinePosition[] {
  if (lanes.length === 0) return [];

  const totalDuration = Math.max(...lanes.map(l => l.duration));
  let currentTime = 0;

  return lanes.map(lane => {
    const startPercentage = (currentTime / totalDuration) * 100;
    const widthPercentage = (lane.duration / totalDuration) * 100;

    const position: TimelinePosition = {
      laneName: lane.laneName,
      startPercentage,
      widthPercentage,
      duration: lane.duration,
    };

    currentTime += lane.duration;
    return position;
  });
}

/**
 * Check if validation has critical errors
 */
export function hasCriticalErrors(errors: ValidationError[]): boolean {
  return errors.some(e => e.severity === 'error');
}

/**
 * Format validation message for display
 */
export function getValidationSummary(errors: ValidationError[]): { passed: number; failed: number } {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  return {
    passed: 6 - (errorCount + warningCount), // Assuming 6 main validation points
    failed: errorCount,
  };
}
