import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trash2,
  Copy,
  Edit,
  CheckCircle,
  AlertCircle,
  Plus,
  FileText,
  Search,
  Filter,
  MoreVertical,
} from 'lucide-react';
import {
  useDrafts,
  getRelativeTime,
  calculateDraftCompletion,
  getDraftDisplayName,
  validateDraft,
} from '../services/draftUtils';
import { AuctionType, DraftStatus, AuctionDraft } from '../types';
import { useToast } from './common';

export function AuctionDrafts() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = 'ADMIN-USER'; // Mock user

  // Draft management
  const { drafts, isLoading, deleteDraft, duplicateDraft, publishDraft } = useDrafts(userId);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<AuctionType | ''>('');
  const [filterStatus, setFilterStatus] = useState<DraftStatus | ''>('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'type'>('recent');

  // Filtered and sorted drafts
  const filteredDrafts = useMemo(() => {
    let result = drafts;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        d =>
          d.draftId.toLowerCase().includes(term) ||
          getDraftDisplayName(d).toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType) {
      result = result.filter(d => d.auctionData.auctionType === filterType);
    }

    // Status filter
    if (filterStatus) {
      result = result.filter(d => d.status === filterStatus);
    }

    // Sorting
    if (sortBy === 'name') {
      result.sort((a, b) =>
        getDraftDisplayName(a).localeCompare(getDraftDisplayName(b))
      );
    } else if (sortBy === 'type') {
      result.sort((a, b) =>
        a.auctionData.auctionType.localeCompare(b.auctionData.auctionType)
      );
    }

    return result;
  }, [drafts, searchTerm, filterType, filterStatus, sortBy]);

  const handleEdit = (draftId: string) => {
    navigate(`/ams/auctions/wizard?draftId=${draftId}`);
  };

  const handleDelete = (draft: AuctionDraft) => {
    if (
      window.confirm(
        'Are you sure you want to delete this draft? This action cannot be undone.'
      )
    ) {
      deleteDraft(draft.draftId);
      showToast({ type: 'success', title: 'Draft deleted' });
    }
  };

  const handleDuplicate = (draft: AuctionDraft) => {
    const newDraftId = duplicateDraft(draft.draftId);
    if (newDraftId) {
      showToast({
        type: 'success',
        title: 'Draft duplicated successfully',
        message: `New ID: ${newDraftId}`,
      });
    } else {
      showToast({ type: 'error', title: 'Failed to duplicate draft' });
    }
  };

  const handlePublish = (draft: AuctionDraft) => {
    // Validate
    const errors = validateDraft(draft);
    if (errors.length > 0) {
      showToast({
        type: 'warning',
        title: 'Cannot publish incomplete draft',
        message: errors.map(e => e.message).join('; '),
      });
      return;
    }

    if (
      window.confirm(
        'Are you sure you want to publish this draft as a live auction?'
      )
    ) {
      const auctionId = publishDraft(draft.draftId, userId);
      if (auctionId) {
        showToast({ type: 'success', title: 'Auction published successfully' });
        navigate(`/ams/auctions/live/${auctionId}`);
      } else {
        showToast({ type: 'error', title: 'Failed to publish draft' });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center">
          <p className="text-slate-600">Loading drafts...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (drafts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No drafts yet</h2>
          <p className="text-slate-500 mb-6">
            Create a new auction draft to get started.
          </p>
          <button
            onClick={() => navigate('/ams/auctions/wizard')}
            className="inline-flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-slate-800 text-white rounded font-medium transition-colors"
          >
            <Plus size={18} />
            <span>Create New Auction</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center space-x-2">
              <FileText size={32} />
              <span>Auction Drafts</span>
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your auction drafts ({drafts.length} total)
            </p>
          </div>
          <button
            onClick={() => navigate('/ams/auctions/wizard')}
            className="inline-flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-slate-800 text-white rounded font-medium transition-colors"
          >
            <Plus size={18} />
            <span>Create New</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2 bg-slate-50 rounded px-3 py-2 border border-slate-300">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by Draft ID or Name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Type
              </label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as AuctionType | '')}
                className="bg-slate-50 border border-slate-300 rounded px-3 py-1 text-sm"
              >
                <option value="">All Types</option>
                {Object.values(AuctionType).map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as DraftStatus | '')}
                className="bg-slate-50 border border-slate-300 rounded px-3 py-1 text-sm"
              >
                <option value="">All Status</option>
                <option value={DraftStatus.INCOMPLETE}>Incomplete</option>
                <option value={DraftStatus.READY}>Ready to Publish</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Sort
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'recent' | 'name' | 'type')}
                className="bg-slate-50 border border-slate-300 rounded px-3 py-1 text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Drafts Table/Cards */}
      {filteredDrafts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-600">No drafts match your filters</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                    Draft ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                    Auction Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                    Lanes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                    Completion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                    Last Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDrafts.map((draft, idx) => {
                  const completion = calculateDraftCompletion(draft);
                  const errors = validateDraft(draft);

                  return (
                    <tr
                      key={draft.draftId}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                        idx === 0 ? '' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FileText size={16} className="text-slate-400" />
                          <code className="text-xs font-mono text-slate-600">
                            {draft.draftId}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {getDraftDisplayName(draft)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded">
                          {draft.auctionData.auctionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {draft.auctionData.lanes.length}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-10">
                            {completion}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getRelativeTime(draft.lastModifiedAt)}
                      </td>
                      <td className="px-6 py-4">
                        {draft.status === DraftStatus.READY ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle size={16} />
                            <span className="text-xs font-semibold">Ready</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-amber-600">
                            <AlertCircle size={16} />
                            <span className="text-xs font-semibold">Incomplete</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => handleEdit(draft.draftId)}
                            title="Edit"
                            className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDuplicate(draft)}
                            title="Duplicate"
                            className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                          {errors.length === 0 && (
                            <button
                              onClick={() => handlePublish(draft)}
                              title="Publish"
                              className="p-1 hover:bg-green-100 text-green-600 rounded transition-colors"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(draft)}
                            title="Delete"
                            className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredDrafts.map(draft => {
              const completion = calculateDraftCompletion(draft);
              const errors = validateDraft(draft);

              return (
                <div
                  key={draft.draftId}
                  className="bg-white p-4 rounded-lg border border-slate-200 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <FileText size={16} className="text-slate-400" />
                        <code className="text-xs font-mono text-slate-600">
                          {draft.draftId}
                        </code>
                      </div>
                      <h3 className="font-semibold text-slate-900">
                        {getDraftDisplayName(draft)}
                      </h3>
                    </div>
                    {draft.status === DraftStatus.READY ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle size={16} />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-amber-600">
                        <AlertCircle size={16} />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                    <div>
                      <p className="font-semibold">Type</p>
                      <p className="text-slate-600">{draft.auctionData.auctionType}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Lanes</p>
                      <p className="text-slate-600">{draft.auctionData.lanes.length}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Modified</p>
                      <p className="text-slate-600">
                        {getRelativeTime(draft.lastModifiedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      {completion}%
                    </span>
                  </div>

                  <div className="flex space-x-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => handleEdit(draft.draftId)}
                      className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded font-semibold hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                    {errors.length === 0 && (
                      <button
                        onClick={() => handlePublish(draft)}
                        className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-600 rounded font-semibold hover:bg-green-200 transition-colors"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(draft)}
                      className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-600 rounded font-semibold hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
