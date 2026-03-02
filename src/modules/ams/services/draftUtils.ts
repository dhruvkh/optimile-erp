import { useState, useEffect, useRef, useCallback } from 'react';
import { auctionEngine } from './mockBackend';
import { AuctionDraft, CreateAuctionRequest } from '../types';

// Draft auto-save state
export enum AutoSaveStatus {
  IDLE = 'IDLE',
  SAVING = 'SAVING',
  SAVED = 'SAVED',
  ERROR = 'ERROR',
}

// Hook: Auto-save form data to draft
export function useAutoSaveDraft(
  draftId: string | null,
  formData: CreateAuctionRequest,
  enabled: boolean = true
) {
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>(AutoSaveStatus.IDLE);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !draftId) return;

    // Clear existing timer
    if (autoSaveTimer.current) {
      clearInterval(autoSaveTimer.current);
    }

    // Auto-save every 30 seconds
    autoSaveTimer.current = setInterval(() => {
      try {
        setAutoSaveStatus(AutoSaveStatus.SAVING);

        const auctionData = {
          name: formData.name,
          auctionType: formData.auctionType,
          globalRuleset: {
            minBidDecrement: formData.ruleset.minBidDecrement,
            timerExtensionThresholdSeconds: formData.ruleset.timerExtensionThresholdSeconds,
            timerExtensionSeconds: formData.ruleset.timerExtensionSeconds,
            allowRankVisibility: formData.ruleset.allowRankVisibility,
          },
          lanes: formData.lanes.map(lane => ({
            laneName: lane.laneName,
            basePrice: lane.basePrice,
            duration: lane.timerDurationSeconds,
            decrement: lane.minBidDecrement,
            tatDays: lane.tatDays,
          })),
        };

        auctionEngine.updateDraft(draftId, auctionData);
        setAutoSaveStatus(AutoSaveStatus.SAVED);
        setLastSaveTime(Date.now());

        // Reset to IDLE after 2 seconds
        setTimeout(() => setAutoSaveStatus(AutoSaveStatus.IDLE), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus(AutoSaveStatus.ERROR);
        setTimeout(() => setAutoSaveStatus(AutoSaveStatus.IDLE), 2000);
      }
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
    };
  }, [enabled, draftId, formData]);

  return { autoSaveStatus, lastSaveTime };
}

// Hook: Manual save draft
export function useSaveDraft() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveDraft = useCallback(
    (formData: CreateAuctionRequest, userId: string): string | null => {
      try {
        setIsSaving(true);
        setError(null);

        const auctionData = {
          name: formData.name,
          auctionType: formData.auctionType,
          globalRuleset: {
            minBidDecrement: formData.ruleset.minBidDecrement,
            timerExtensionThresholdSeconds:
              formData.ruleset.timerExtensionThresholdSeconds,
            timerExtensionSeconds: formData.ruleset.timerExtensionSeconds,
            allowRankVisibility: formData.ruleset.allowRankVisibility,
          },
          lanes: formData.lanes.map(lane => ({
            laneName: lane.laneName,
            basePrice: lane.basePrice,
            duration: lane.timerDurationSeconds,
            decrement: lane.minBidDecrement,
            tatDays: lane.tatDays,
          })),
        };

        const draftId = auctionEngine.saveDraft({ auctionData, createdBy: userId });
        setIsSaving(false);
        return draftId;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to save draft';
        setError(errorMsg);
        setIsSaving(false);
        return null;
      }
    },
    []
  );

  return { saveDraft, isSaving, error };
}

// Hook: Load draft and return form data
export function useDraft(draftId: string | null) {
  const [draft, setDraft] = useState<AuctionDraft | null>(null);
  const [formData, setFormData] = useState<CreateAuctionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draftId) return;

    try {
      setIsLoading(true);
      setError(null);

      const loadedDraft = auctionEngine.getDraft(draftId);
      if (!loadedDraft) {
        throw new Error('Draft not found');
      }

      setDraft(loadedDraft);

      // Convert draft to form data
      const formData: CreateAuctionRequest = {
        name: loadedDraft.auctionData.name,
        auctionType: loadedDraft.auctionData.auctionType,
        clientId: 'CLIENT-001',
        createdBy: loadedDraft.createdBy,
        ruleset: loadedDraft.auctionData.globalRuleset,
        lanes: loadedDraft.auctionData.lanes.map(lane => ({
          laneName: lane.laneName,
          sequenceOrder: loadedDraft.auctionData.lanes.indexOf(lane) + 1,
          basePrice: lane.basePrice,
          minBidDecrement: lane.decrement,
          timerDurationSeconds: lane.duration,
          tatDays: lane.tatDays,
        })),
      };

      setFormData(formData);
      setIsLoading(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load draft';
      setError(errorMsg);
      setIsLoading(false);
    }
  }, [draftId]);

  return { draft, formData, isLoading, error };
}

// Hook: Manage all drafts
export function useDrafts(userId?: string) {
  const [drafts, setDrafts] = useState<AuctionDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      setIsLoading(true);
      const draftList = userId
        ? auctionEngine.getDraftsByUser(userId)
        : auctionEngine.getAllDrafts();
      setDrafts(draftList);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      setIsLoading(false);
    }
  }, [userId]);

  const deleteDraft = useCallback((draftId: string) => {
    try {
      auctionEngine.deleteDraft(draftId);
      setDrafts(prev => prev.filter(d => d.draftId !== draftId));
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }, []);

  const duplicateDraft = useCallback((draftId: string): string | null => {
    try {
      const newDraftId = auctionEngine.duplicateDraft(draftId);
      // Refresh drafts list
      const draftList = userId
        ? auctionEngine.getDraftsByUser(userId)
        : auctionEngine.getAllDrafts();
      setDrafts(draftList);
      return newDraftId;
    } catch (error) {
      console.error('Failed to duplicate draft:', error);
      return null;
    }
  }, [userId]);

  const publishDraft = useCallback(
    (draftId: string, userId: string): string | null => {
      try {
        const auctionId = auctionEngine.publishDraft(draftId, userId);
        setDrafts(prev => prev.filter(d => d.draftId !== draftId));
        return auctionId;
      } catch (error) {
        console.error('Failed to publish draft:', error);
        return null;
      }
    },
    []
  );

  return { drafts, isLoading, deleteDraft, duplicateDraft, publishDraft };
}

// Hook: Subscribe to draft updates
export function useDraftSubscription() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = auctionEngine.subscribe(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, []);
}

// Utility: Get relative time string (e.g., "2 hours ago")
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Utility: Calculate draft completion percentage
export function calculateDraftCompletion(draft: AuctionDraft): number {
  let completed = 0;
  const total = 4; // name, type, ruleset, lanes

  if (draft.auctionData.name.trim()) completed++;
  if (draft.auctionData.auctionType) completed++;
  if (draft.auctionData.globalRuleset.minBidDecrement > 0) completed++;
  if (draft.auctionData.lanes.length > 0) completed++;

  return Math.round((completed / total) * 100);
}

// Utility: Get draft display name
export function getDraftDisplayName(draft: AuctionDraft): string {
  return draft.auctionData.name.trim() || 'Untitled Auction';
}

// Utility: Validate draft before publishing
export interface DraftValidationError {
  field: string;
  message: string;
}

export function validateDraft(draft: AuctionDraft): DraftValidationError[] {
  const errors: DraftValidationError[] = [];

  if (!draft.auctionData.name.trim()) {
    errors.push({ field: 'name', message: 'Auction name is required' });
  }

  if (!draft.auctionData.auctionType) {
    errors.push({ field: 'type', message: 'Auction type is required' });
  }

  if (draft.auctionData.lanes.length === 0) {
    errors.push({ field: 'lanes', message: 'At least one lane is required' });
  }

  for (const lane of draft.auctionData.lanes) {
    if (!lane.laneName.trim()) {
      errors.push({ field: 'lanes', message: 'All lanes must have names' });
      break;
    }
    if (lane.basePrice <= 0) {
      errors.push({ field: 'lanes', message: 'All lanes must have base prices > 0' });
      break;
    }
  }

  if (draft.auctionData.globalRuleset.minBidDecrement <= 0) {
    errors.push({ field: 'ruleset', message: 'Minimum bid decrement must be > 0' });
  }

  return errors;
}
