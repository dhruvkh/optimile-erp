import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Heart,
  Copy,
  Trash2,
  Share2,
  Zap,
  Clock,
  Grid3x3,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import * as Types from '../../types';
import { auctionEngine } from '../../services/mockBackend';
import {
  formatLastUsed,
  getTemplateTypeColor,
  getTemplateStatisticsSummary,
  canDeleteTemplate,
  canEditTemplate,
} from '../../services/templateUtils';

export const TemplateDetails: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [expandedLane, setExpandedLane] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const template = templateId ? auctionEngine.getTemplate(templateId) : null;

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h2>
            <p className="text-gray-600 mb-6">The template you're looking for does not exist.</p>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              onClick={() => navigate('/ams/auctions/create')}
            >
              Back to Templates
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = getTemplateStatisticsSummary(template);
  const userId = 'current-user'; // In real app, get from auth

  const handleUseTemplate = () => {
    auctionEngine.recordTemplateUsage(template.templateId, userId);
    navigate(`/create-auction?templateId=${template.templateId}`);
  };

  const handleToggleFavorite = () => {
    auctionEngine.toggleFavorite(template.templateId);
  };

  const handleDuplicate = () => {
    const newTemplateId = auctionEngine.duplicateTemplate(template.templateId, userId);
    navigate(`/ams/auction-templates/${newTemplateId}`);
  };

  const handleDelete = () => {
    try {
      auctionEngine.deleteTemplate(template.templateId);
      navigate('/ams/auctions/create');
    } catch (err) {
      alert('Cannot delete system templates');
    }
  };

  const handleEdit = () => {
    navigate(`/ams/auction-templates/${template.templateId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
          onClick={() => navigate('/ams/auctions/create')}
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Templates
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{template.templateName}</h1>
                {template.isFavorite && (
                  <Heart className="w-6 h-6 text-red-500 fill-current" />
                )}
              </div>
              {template.description && (
                <p className="text-gray-600 text-lg">{template.description}</p>
              )}
            </div>

            {/* Type Badge */}
            <div className="flex flex-col items-end gap-2">
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getTemplateTypeColor(template.auctionConfiguration.auctionType)}`}>
                {template.auctionConfiguration.auctionType}
              </span>
              {template.isSystemTemplate && (
                <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-100 text-purple-800">
                  Official Template
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
              onClick={handleUseTemplate}
            >
              <Zap className="w-5 h-5" />
              Use Template
            </button>

            {!template.isSystemTemplate && (
              <>
                <button
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg flex items-center gap-2 transition-colors"
                  onClick={handleEdit}
                >
                  Edit
                </button>
                <button
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg flex items-center gap-2 transition-colors"
                  onClick={handleToggleFavorite}
                >
                  <Heart className={`w-5 h-5 ${template.isFavorite ? 'fill-current text-red-500' : ''}`} />
                  {template.isFavorite ? 'Unfavorite' : 'Favorite'}
                </button>
              </>
            )}

            <button
              className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg flex items-center gap-2 transition-colors"
              onClick={handleDuplicate}
            >
              <Copy className="w-5 h-5" />
              Duplicate
            </button>

            {!template.isSystemTemplate && (
              <>
                <button
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg flex items-center gap-2 transition-colors"
                  onClick={() => {}}
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
                <button
                  className="px-4 py-2 border border-red-300 hover:bg-red-50 text-red-700 font-medium rounded-lg flex items-center gap-2 transition-colors"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Times Used</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.timesUsed}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avg Savings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageSavings}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Lanes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{template.auctionConfiguration.lanes.length}</p>
              </div>
              <Grid3x3 className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Most Used By</p>
                <p className="text-lg font-semibold text-gray-900 mt-1 truncate">{stats.mostUsedBy}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Template Configuration Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Global Ruleset</h2>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-gray-600 text-sm font-medium">Min Bid Decrement</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{template.auctionConfiguration.globalRuleset.minBidDecrement.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Extension Threshold</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {template.auctionConfiguration.globalRuleset.timerExtensionThresholdSeconds}s
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Extension Duration</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {template.auctionConfiguration.globalRuleset.timerExtensionSeconds}s
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Rank Visibility</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {template.auctionConfiguration.globalRuleset.allowRankVisibility ? '✓' : '✗'}
              </p>
            </div>
          </div>
        </div>

        {/* Lanes Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Lanes Configuration</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {template.auctionConfiguration.lanes.map((lane, idx) => (
              <div key={idx} className="hover:bg-gray-50 transition-colors">
                <button
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedLane(expandedLane === idx ? null : idx)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{lane.laneName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Base Price: ₹{lane.basePrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                      {lane.duration}s
                    </span>
                    {expandedLane === idx ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Lane Details */}
                {expandedLane === idx && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Base Price</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          ₹{lane.basePrice.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Duration</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{lane.duration}s</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Decrement</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          ₹{lane.decrement.toLocaleString()}
                        </p>
                      </div>
                      {lane.tatDays !== undefined && (
                        <div>
                          <p className="text-gray-600 text-sm font-medium">TAT (Days)</p>
                          <p className="text-xl font-bold text-gray-900 mt-1">{lane.tatDays}</p>
                        </div>
                      )}
                    </div>

                    {/* Calculations */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-lg p-4 border border-gray-200">
                      <div>
                        <p className="text-gray-600 text-xs font-medium">Extensions Possible</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {Math.floor(
                            lane.duration / template.auctionConfiguration.globalRuleset.timerExtensionThresholdSeconds
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs font-medium">Max Discount</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ₹
                          {(
                            Math.floor(
                              lane.duration / template.auctionConfiguration.globalRuleset.timerExtensionThresholdSeconds
                            ) * lane.decrement
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs font-medium">Min Price (20% Floor)</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ₹
                          {Math.max(
                            lane.basePrice -
                              Math.floor(
                                lane.duration / template.auctionConfiguration.globalRuleset.timerExtensionThresholdSeconds
                              ) *
                                lane.decrement,
                            lane.basePrice * 0.2
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs font-medium">Potential Savings</p>
                        <p className="text-lg font-bold text-green-600 mt-1">
                          {(
                            (1 -
                              Math.max(
                                lane.basePrice -
                                  Math.floor(
                                    lane.duration / template.auctionConfiguration.globalRuleset.timerExtensionThresholdSeconds
                                  ) *
                                    lane.decrement,
                                lane.basePrice * 0.2
                              ) /
                                lane.basePrice) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Metadata Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Template Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-600 text-sm font-medium">Created By</p>
              <p className="text-gray-900 mt-1 font-semibold">{template.createdBy}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Created On</p>
              <p className="text-gray-900 mt-1 font-semibold">
                {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Last Modified</p>
              <p className="text-gray-900 mt-1 font-semibold">
                {new Date(template.lastModifiedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Visibility</p>
              <p className="text-gray-900 mt-1 font-semibold capitalize">{template.visibility}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Category</p>
              <p className="text-gray-900 mt-1 font-semibold">{template.category}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Template ID</p>
              <p className="text-gray-900 mt-1 font-mono text-xs">{template.templateId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Template?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{template.templateName}"? This action cannot be undone.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Note: Existing auctions created from this template won't be affected.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
