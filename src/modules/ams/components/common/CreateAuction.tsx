import React, { useState, useEffect } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { AuctionType, CreateAuctionRequest } from '../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Copy,
} from 'lucide-react';
import {
  useAutoSaveDraft,
  useSaveDraft,
  useDraft,
  getRelativeTime,
  validateDraft,
} from '../../services/draftUtils';
import { generateAuctionNameFromTemplate } from '../../services/templateUtils';
import { AuctionPreview } from '../AuctionPreview';
import { useToast } from './common';
import { BulkLaneUploadModal } from '../BulkLaneUploadModal';
import { BULK_LANE_DRAFT_STORAGE_KEY } from '../BulkLaneUploadPage';

export function CreateAuction() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const draftIdFromUrl = searchParams.get('draftId');
  const templateIdFromUrl = searchParams.get('templateId');

  // State
  const [formData, setFormData] = useState<CreateAuctionRequest>({
    name: '',
    auctionType: AuctionType.REVERSE,
    clientId: 'CLIENT-001',
    createdBy: 'ADMIN-USER',
    ruleset: {
      minBidDecrement: 100,
      timerExtensionThresholdSeconds: 10,
      timerExtensionSeconds: 120,
      allowRankVisibility: true,
    },
    lanes: [
      {
        laneName: 'Mumbai -> Delhi (FTL)',
        sequenceOrder: 1,
        basePrice: 50000,
        minBidDecrement: 100,
        timerDurationSeconds: 300,
        tatDays: 4,
      },
    ],
  });

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [usingTemplate, setUsingTemplate] = useState<{ id: string; name: string } | null>(null);

  const [draftId, setDraftId] = useState<string | null>(draftIdFromUrl);
  const [isCreatingFromDraft, setIsCreatingFromDraft] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Load draft if provided
  const { draft: loadedDraft, formData: draftFormData, isLoading: isDraftLoading } = useDraft(
    draftIdFromUrl
  );

  useEffect(() => {
    const rawBulkDraft = localStorage.getItem(BULK_LANE_DRAFT_STORAGE_KEY);
    if (!draftIdFromUrl && !templateIdFromUrl && rawBulkDraft) {
      try {
        const parsed = JSON.parse(rawBulkDraft) as { lanes: CreateAuctionRequest['lanes'] };
        if (parsed.lanes?.length) {
          setFormData((prev) => ({
            ...prev,
            lanes: parsed.lanes.map((lane, idx) => ({
              ...lane,
              sequenceOrder: idx + 1,
            })),
          }));
          showToast({
            type: 'success',
            title: 'Bulk upload draft loaded',
            message: `${parsed.lanes.length} lanes loaded from standalone bulk upload.`,
          });
        }
      } catch {
        // no-op
      } finally {
        localStorage.removeItem(BULK_LANE_DRAFT_STORAGE_KEY);
      }
    }

    // Handle template loading
    if (templateIdFromUrl) {
      const template = auctionEngine.getTemplate(templateIdFromUrl);
      if (template) {
        setUsingTemplate({ id: templateIdFromUrl, name: template.templateName });
        
        // Convert template to form data
        const templateFormData: CreateAuctionRequest = {
          name: generateAuctionNameFromTemplate(template.templateName, true),
          auctionType: template.auctionConfiguration.auctionType,
          clientId: 'CLIENT-001',
          createdBy: 'ADMIN-USER',
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
        setFormData(templateFormData);
        showToast({
          type: 'success',
          title: 'Template loaded',
          message: `Using template: ${template.templateName}. You can modify any fields before publishing.`,
        });
      }
    }
    // Handle draft loading
    else if (draftFormData) {
      setFormData(draftFormData);
      setIsCreatingFromDraft(true);
    }
  }, [draftFormData, templateIdFromUrl]);

  // Auto-save
  const { autoSaveStatus, lastSaveTime } = useAutoSaveDraft(draftId, formData, !!draftId);

  // Manual save
  const { saveDraft: manualSaveDraft, isSaving } = useSaveDraft();

  const handleLaneChange = (index: number, field: string, value: any) => {
    const newLanes = [...formData.lanes];
    // @ts-ignore
    newLanes[index][field] = value;
    setFormData({ ...formData, lanes: newLanes });
  };

  const addLane = () => {
    setFormData({
      ...formData,
      lanes: [
        ...formData.lanes,
        {
          laneName: '',
          sequenceOrder: formData.lanes.length + 1,
          basePrice: 0,
          minBidDecrement: 100,
          timerDurationSeconds: 300,
          tatDays: 3,
        },
      ],
    });
  };

  const handleBulkImport = (lanes: CreateAuctionRequest['lanes']) => {
    setFormData((prev) => ({
      ...prev,
      lanes: [
        ...prev.lanes,
        ...lanes.map((lane, idx) => ({
          ...lane,
          sequenceOrder: prev.lanes.length + idx + 1,
        })),
      ],
    }));
    setShowBulkUpload(false);
  };

  const removeLane = (index: number) => {
    const newLanes = formData.lanes.filter((_, i) => i !== index);
    setFormData({ ...formData, lanes: newLanes });
  };

  const handleSaveAsDraft = async () => {
    try {
      let savedDraftId = draftId;

      if (!draftId) {
        // Create new draft
        savedDraftId = manualSaveDraft(formData, formData.createdBy);
        if (savedDraftId) {
          setDraftId(savedDraftId);
          showToast({
            type: 'success',
            title: 'Draft saved successfully',
            message: `Draft ID: ${savedDraftId}`,
          });
        } else {
          showToast({ type: 'error', title: 'Failed to save draft', message: 'Please try again' });
        }
      } else {
        // Update existing draft
        auctionEngine.updateDraft(draftId, {
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
        });
        showToast({ type: 'success', title: 'Draft updated successfully' });
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      showToast({ type: 'error', title: 'Error saving draft' });
    }
  };

  const handleSaveAsTemplate = () => {
    const templateName = prompt('Enter template name:', formData.name);
    if (!templateName) return;

    const description = prompt('Enter template description (optional):', '');

    try {
      const templateId = auctionEngine.createTemplate({
        templateName,
        description: description || undefined,
        category: 'Other' as any,
        visibility: 'private' as any,
        isFavorite: false,
        auctionConfiguration: {
          auctionType: formData.auctionType,
          globalRuleset: formData.ruleset,
          lanes: formData.lanes.map(lane => ({
            laneName: lane.laneName,
            basePrice: lane.basePrice,
            duration: lane.timerDurationSeconds,
            decrement: lane.minBidDecrement,
            tatDays: lane.tatDays,
          })),
        },
        createdBy: formData.createdBy,
      });

      showToast({
        type: 'success',
        title: 'Template saved successfully',
        message: `You can now reuse this template for future auctions.`,
      });

      // Optional: navigate to template details
      navigate(`/ams/auction-templates/${templateId}`);
    } catch (err) {
      console.error('Error saving template:', err);
      showToast({ type: 'error', title: 'Error saving template', message: 'Please try again' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const errors = validateDraft({
      draftId: draftId || 'temp',
      auctionData: {
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
      },
      createdBy: formData.createdBy,
      createdAt: Date.now(),
      lastModifiedAt: Date.now(),
      status: 'INCOMPLETE',
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    if (errors.length > 0) {
      showToast({
        type: 'error',
        title: 'Validation Failed',
        message: errors.map(e => e.message).join(', '),
      });
      return;
    }

    try {
      // If this is from a draft, publish it
      if (draftId) {
        const auctionId = auctionEngine.publishDraft(draftId, formData.createdBy);
        showToast({ type: 'success', title: 'Auction published successfully' });
        navigate(`/ams/auctions/live/${auctionId}`);
      } else {
        // Create new auction directly
        const id = auctionEngine.createAuction(formData);
        showToast({ type: 'success', title: 'Auction created successfully' });
        navigate(`/ams/auctions/live/${id}`);
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Error creating auction' });
      console.error(err);
    }
  };

  const handleCancel = () => {
    navigate('/ams/auctions/create');
  };

  if (isDraftLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <p className="text-slate-600">Loading draft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Auto-save Status Indicator */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isCreatingFromDraft ? 'Edit Auction Draft' : 'Create New Auction'}
          </h1>
          <p className="text-slate-500">
            {isCreatingFromDraft
              ? 'Continue editing your draft'
              : 'Configure auction rules and add lanes.'}
          </p>
        </div>

        {/* Save Status Indicator */}
        <div className="flex items-center space-x-3">
          {draftId && (
            <>
              <div className="text-right">
                {autoSaveStatus === 'SAVING' && (
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Clock size={16} className="animate-spin" />
                    <span className="text-sm">Saving...</span>
                  </div>
                )}
                {autoSaveStatus === 'SAVED' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle size={16} />
                    <span className="text-sm">All changes saved</span>
                  </div>
                )}
                {autoSaveStatus === 'ERROR' && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle size={16} />
                    <span className="text-sm">Save failed</span>
                  </div>
                )}
                {autoSaveStatus === 'IDLE' && lastSaveTime && (
                  <p className="text-xs text-slate-500">
                    Last saved: {getRelativeTime(lastSaveTime)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Draft Banner */}
      {isCreatingFromDraft && loadedDraft && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Editing Draft:</strong> {loadedDraft.draftId} | Last saved:{' '}
            {getRelativeTime(loadedDraft.lastModifiedAt)}
          </p>
        </div>
      )}

      {/* Template Banner */}
      {usingTemplate && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-900">
            <strong>Using Template:</strong> {usingTemplate.name} | You can modify any fields before publishing.{' '}
            <button
              type="button"
              className="text-purple-700 hover:text-purple-900 underline font-semibold"
              onClick={() => navigate(`/ams/auction-templates/${usingTemplate.id}`)}
            >
              View Template Details
            </button>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 border-b border-slate-100 pb-2">
            General Information
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Auction Name
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-accent outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Q4 Logistics Allocation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type
              </label>
              <select
                className="w-full border border-slate-300 rounded px-3 py-2 bg-white"
                value={formData.auctionType}
                onChange={e =>
                  setFormData({
                    ...formData,
                    auctionType: e.target.value as AuctionType,
                  })
                }
              >
                {Object.values(AuctionType).map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Ruleset */}
        <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 border-b border-slate-100 pb-2">
            Global Ruleset
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Default Decrement (INR)
              </label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded px-3 py-2"
                value={formData.ruleset.minBidDecrement}
                onChange={e =>
                  setFormData({
                    ...formData,
                    ruleset: {
                      ...formData.ruleset,
                      minBidDecrement: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Extension Threshold (sec)
              </label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded px-3 py-2"
                value={formData.ruleset.timerExtensionThresholdSeconds}
                onChange={e =>
                  setFormData({
                    ...formData,
                    ruleset: {
                      ...formData.ruleset,
                      timerExtensionThresholdSeconds: Number(e.target.value),
                    },
                  })
                }
              />
              <p className="text-xs text-slate-400 mt-1">
                Bids in this window extend timer.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Extension Duration (sec)
              </label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded px-3 py-2"
                value={formData.ruleset.timerExtensionSeconds}
                onChange={e =>
                  setFormData({
                    ...formData,
                    ruleset: {
                      ...formData.ruleset,
                      timerExtensionSeconds: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        </section>

        {/* Lanes */}
        <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h2 className="text-lg font-semibold">
              Lanes ({formData.lanes.length})
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowBulkUpload(true)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 flex items-center"
              >
                📤 Bulk Upload Lanes
              </button>
              <button
                type="button"
                onClick={addLane}
                className="text-accent text-sm font-medium hover:underline flex items-center"
              >
                <Plus size={16} className="mr-1" /> Add Lane
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {formData.lanes.map((lane, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-4 p-4 bg-slate-50 rounded border border-slate-200"
              >
                <div className="flex-1 grid grid-cols-12 gap-4">
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Lane Name
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      value={lane.laneName}
                      onChange={e =>
                        handleLaneChange(idx, 'laneName', e.target.value)
                      }
                      placeholder="Origin -> Dest"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Base Price
                    </label>
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      value={lane.basePrice}
                      onChange={e =>
                        handleLaneChange(idx, 'basePrice', Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Duration (s)
                    </label>
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      value={lane.timerDurationSeconds}
                      onChange={e =>
                        handleLaneChange(
                          idx,
                          'timerDurationSeconds',
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Decr.
                    </label>
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      value={lane.minBidDecrement}
                      onChange={e =>
                        handleLaneChange(
                          idx,
                          'minBidDecrement',
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      TAT (Days)
                    </label>
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      value={lane.tatDays || ''}
                      onChange={e =>
                        handleLaneChange(
                          idx,
                          'tatDays',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                </div>
                {formData.lanes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLane(idx)}
                    className="mt-6 text-slate-400 hover:text-danger"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 border-t gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Preview Button */}
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <Eye size={18} />
              <span>Preview</span>
            </button>

            {/* Save as Template Button */}
            <button
              type="button"
              onClick={handleSaveAsTemplate}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <Copy size={18} />
              <span>Save as Template</span>
            </button>

            {/* Save as Draft Button */}
            <button
              type="button"
              onClick={handleSaveAsDraft}
              disabled={isSaving}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              <span>{isSaving ? 'Saving...' : 'Save as Draft'}</span>
            </button>

            {/* Create/Publish Button */}
            <button
              type="submit"
              className="px-6 py-2 bg-primary hover:bg-slate-800 text-white rounded font-medium shadow-lg shadow-primary/30 transition-colors"
            >
              {isCreatingFromDraft ? 'Publish Auction' : 'Create Auction'}
            </button>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <AuctionPreview
            formData={formData}
            onClose={() => setShowPreview(false)}
            onEdit={() => setShowPreview(false)}
            onSaveDraft={() => {
              handleSaveAsDraft();
              setShowPreview(false);
            }}
            onPublish={() => {
              handleSubmit(new Event('submit') as unknown as React.FormEvent);
              setShowPreview(false);
            }}
            isModal={true}
          />
        )}

        <BulkLaneUploadModal
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          onImport={handleBulkImport}
          existingLaneNames={formData.lanes.map((l) => l.laneName)}
          title="Bulk Upload Lanes"
        />
      </form>
    </div>
  );
}
