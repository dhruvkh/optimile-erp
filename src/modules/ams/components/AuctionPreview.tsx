import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  X,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Truck,
  Eye,
  EyeOff,
  Download,
  Share2,
  Zap,
  TrendingDown,
  Users,
  Monitor,
} from 'lucide-react';
import {
  generateAuctionPreview,
  formatDuration,
  formatPrice,
  getAuctionTypeColor,
  calculateTimelinePositions,
  hasCriticalErrors,
  getExtensionExplanation,
} from '../services/previewUtils';
import { CreateAuctionRequest, AuctionPreviewData, PreviewMode } from '../types';
import { useToast } from './common';

interface AuctionPreviewProps {
  formData: CreateAuctionRequest;
  onClose?: () => void;
  onPublish?: (formData: CreateAuctionRequest) => void;
  onSaveDraft?: (formData: CreateAuctionRequest) => void;
  onEdit?: () => void;
  isModal?: boolean;
}

export function AuctionPreview({
  formData,
  onClose,
  onPublish,
  onSaveDraft,
  onEdit,
  isModal = false,
}: AuctionPreviewProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Preview state
  const [previewData, setPreviewData] = useState<AuctionPreviewData | null>(null);
  const [viewAs, setViewAs] = useState<'admin' | 'vendor'>('admin');
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [expandedLane, setExpandedLane] = useState<number | null>(null);

  // Load preview data
  useEffect(() => {
    try {
      const preview = generateAuctionPreview(formData, 'create');
      setPreviewData(preview);
    } catch (err) {
      console.error('Preview generation failed:', err);
      showToast({ type: 'error', title: 'Failed to generate preview' });
    }
  }, [formData, showToast]);

  if (!previewData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4" />
          <p className="text-slate-600">Generating preview...</p>
        </div>
      </div>
    );
  }

  const hasCritical = hasCriticalErrors(previewData.validationErrors);
  const timelinePositions = calculateTimelinePositions(previewData.lanes);
  const extensionExplanation = getExtensionExplanation(
    previewData.globalRuleset.timerExtensionThresholdSeconds,
    previewData.globalRuleset.timerExtensionSeconds
  );

  const handlePublish = () => {
    if (hasCritical) {
      showToast({
        type: 'error',
        title: 'Cannot publish',
        message: 'Fix validation errors before publishing',
      });
      return;
    }

    if (window.confirm('Publish this auction as live?')) {
      onPublish?.(formData);
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(formData);
    showToast({ type: 'success', title: 'Draft saved successfully' });
  };

  // Responsive wrapper class
  const getResponsiveClass = () => {
    if (deviceType === 'mobile') return 'max-w-sm';
    if (deviceType === 'tablet') return 'max-w-2xl';
    return 'max-w-6xl';
  };

  const wrapperClass = isModal
    ? `fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4`
    : `min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8`;

  const contentClass = isModal
    ? `bg-white rounded-lg shadow-2xl ${getResponsiveClass()} max-h-[90vh] overflow-y-auto`
    : `max-w-6xl mx-auto`;

  return (
    <div className={wrapperClass}>
      <div className={contentClass}>
        {/* Close button (modal only) */}
        {isModal && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 pb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {previewData.auctionName || 'Untitled Auction'}
              </h1>
              <p className="text-slate-500 mt-1">Draft - Not Yet Published</p>
            </div>
            <span className={`inline-block px-4 py-2 rounded-full font-semibold w-fit ${getAuctionTypeColor(previewData.auctionType)}`}>
              {previewData.auctionType}
            </span>
          </div>

          {/* View toggles */}
          <div className="flex flex-wrap gap-4 mt-6">
            {/* Vendor view toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewAs(viewAs === 'admin' ? 'vendor' : 'admin')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  viewAs === 'vendor'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {viewAs === 'vendor' ? <Eye size={18} /> : <EyeOff size={18} />}
                <span className="text-sm font-medium">
                  {viewAs === 'vendor' ? 'Vendor View' : 'Admin View'}
                </span>
              </button>
            </div>

            {/* Device selector */}
            <div className="flex items-center space-x-2">
              {(['desktop', 'tablet', 'mobile'] as const).map(device => (
                <button
                  key={device}
                  onClick={() => setDeviceType(device)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    deviceType === device
                      ? 'bg-accent text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Monitor size={16} className="inline mr-1" />
                  {device.charAt(0).toUpperCase() + device.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-6 py-6">
          {/* SECTION 1: Auction Details & Timeline */}
          {viewAs === 'admin' && (
            <section className="bg-white p-6 rounded-lg border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Clock size={20} className="text-accent" />
                <span>Timing & Schedule</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Estimated Start</p>
                  <p className="font-semibold text-slate-900">Immediately upon publishing</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Total Duration</p>
                  <p className="font-semibold text-slate-900 flex items-center space-x-2">
                    <Zap size={16} className="text-amber-500" />
                    <span>{formatDuration(previewData.longestLaneDuration)}</span>
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Estimated Completion</p>
                  <p className="font-semibold text-slate-900">
                    {formatDuration(Math.ceil(previewData.estimatedCompletionTime / 1000))}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2: Global Rules */}
          <section className="bg-white p-6 rounded-lg border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Zap size={20} className="text-accent" />
              <span>Global Rules</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Default Decrement</p>
                <p className="font-semibold text-slate-900">
                  {formatPrice(previewData.globalRuleset.minBidDecrement)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Extension Threshold</p>
                <p className="font-semibold text-slate-900">
                  {previewData.globalRuleset.timerExtensionThresholdSeconds}s
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Extension Duration</p>
                <p className="font-semibold text-slate-900">
                  {previewData.globalRuleset.timerExtensionSeconds}s
                </p>
              </div>
            </div>

            {/* Extension explanation tooltip */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">How it works:</span> {extensionExplanation}
              </p>
            </div>
          </section>

          {/* SECTION 3: Lanes Summary */}
          <section className="bg-white p-6 rounded-lg border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Truck size={20} className="text-accent" />
              <span>Lanes ({previewData.lanes.length})</span>
            </h2>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold">Total Lanes</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {previewData.lanes.length}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 font-semibold">Total Base Value</p>
                <p className="text-lg font-bold text-green-900 mt-1">
                  {formatPrice(previewData.totalBaseValue)}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-600 font-semibold">Avg Duration</p>
                <p className="text-lg font-bold text-orange-900 mt-1">
                  {formatDuration(previewData.averageLaneDuration)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-600 font-semibold">Range</p>
                <p className="text-xs font-bold text-purple-900 mt-1">
                  {formatDuration(previewData.shortestLaneDuration)} -{' '}
                  {formatDuration(previewData.longestLaneDuration)}
                </p>
              </div>
            </div>

            {/* Lanes list */}
            <div className="space-y-3">
              {previewData.lanes.map((lane, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-lg overflow-hidden hover:border-accent transition-colors"
                >
                  <button
                    onClick={() => setExpandedLane(expandedLane === idx ? null : idx)}
                    className="w-full px-4 py-3 hover:bg-slate-50 transition-colors flex items-between justify-between"
                  >
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
                        <Truck size={16} className="text-slate-400" />
                        <span>{lane.laneName}</span>
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Base: {formatPrice(lane.basePrice)} • Duration: {formatDuration(lane.duration)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-accent">
                        {formatPrice(lane.basePrice)}
                      </p>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {expandedLane === idx && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-slate-600 font-semibold">Base Price</p>
                          <p className="text-sm font-bold text-slate-900 mt-1">
                            {formatPrice(lane.basePrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-semibold">Duration</p>
                          <p className="text-sm font-bold text-slate-900 mt-1">
                            {formatDuration(lane.duration)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-semibold">Min Decrement</p>
                          <p className="text-sm font-bold text-slate-900 mt-1">
                            {formatPrice(lane.decrement)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-semibold">Min Possible Price</p>
                          <p className="text-sm font-bold text-accent mt-1">
                            {formatPrice(lane.minPossiblePrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-semibold">Estimated Savings</p>
                          <p className="text-sm font-bold text-green-600 mt-1">
                            ~{lane.estimatedSavings}%
                          </p>
                        </div>
                        {lane.tatDays && (
                          <div>
                            <p className="text-xs text-slate-600 font-semibold">TAT</p>
                            <p className="text-sm font-bold text-slate-900 mt-1">
                              {lane.tatDays} days
                            </p>
                          </div>
                        )}
                      </div>

                      {viewAs === 'vendor' && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900">
                          This is what vendors will see on their portal.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: Timeline Visualization */}
          {viewAs === 'admin' && (
            <section className="bg-white p-6 rounded-lg border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Clock size={20} className="text-accent" />
                <span>Lane Timeline</span>
              </h2>

              <div className="space-y-3">
                {timelinePositions.map((pos, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {previewData.lanes[idx].laneName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDuration(pos.duration)}
                      </span>
                    </div>
                    <div className="h-8 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{
                          marginLeft: `${pos.startPercentage}%`,
                          width: `${pos.widthPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 5: Vendor Eligibility */}
          {viewAs === 'admin' && (
            <section className="bg-white p-6 rounded-lg border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Users size={20} className="text-accent" />
                <span>Vendor Information</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Eligible Vendors</p>
                  <p className="font-semibold text-slate-900">
                    {previewData.vendorEligibilityCount || 'All vendors'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Est. Participants</p>
                  <p className="font-semibold text-slate-900">
                    ~{previewData.estimatedParticipantCount} vendors
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Visibility</p>
                  <p className="font-semibold text-slate-900">
                    {previewData.globalRuleset.allowRankVisibility
                      ? 'Show Rankings'
                      : 'Hide Rankings'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 6: Validation Status */}
          <section className="bg-white p-6 rounded-lg border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              {hasCritical ? (
                <AlertCircle size={20} className="text-red-600" />
              ) : (
                <CheckCircle size={20} className="text-green-600" />
              )}
              <span>Validation Status</span>
            </h2>

            {previewData.validationErrors.length === 0 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-900 font-semibold flex items-center space-x-2">
                  <CheckCircle size={18} />
                  <span>All validations passed! Ready to publish.</span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {previewData.validationErrors.map((error, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg flex items-start space-x-3 ${
                      error.severity === 'error'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    {error.severity === 'error' ? (
                      <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p
                        className={`font-semibold text-sm ${
                          error.severity === 'error'
                            ? 'text-red-900'
                            : 'text-yellow-900'
                        }`}
                      >
                        {error.field}: {error.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Action buttons */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 space-y-3 sm:flex sm:space-y-0 sm:space-x-3 justify-between">
          <div className="flex gap-3">
            <button
              onClick={onEdit || (() => navigate(-1))}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={18} />
              <span>Back to Edit</span>
            </button>
            <button
              onClick={handleSaveDraft}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Save size={18} />
              <span>Save Draft</span>
            </button>
          </div>

          <button
            onClick={handlePublish}
            disabled={hasCritical}
            className={`flex-1 px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
              hasCritical
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-primary hover:bg-slate-800 text-white'
            }`}
          >
            <CheckCircle size={18} />
            <span>Publish Auction</span>
          </button>
        </div>
      </div>
    </div>
  );
}
