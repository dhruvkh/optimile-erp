import React, { useState, useMemo } from 'react';
import {
  Grid3x3,
  List,
  Search,
  Plus,
  MoreVertical,
  Heart,
  Copy,
  Trash2,
  Share2,
  Eye,
  Zap,
} from 'lucide-react';
import * as Types from '../types';
import {
  filterTemplatesByType,
  filterTemplatesByCreator,
  filterTemplatesByVisibility,
  searchTemplates,
  getFavoriteTemplates,
  sortTemplates,
  TemplateSortOption,
  formatLastUsed,
  getTemplateTypeColor,
  getTemplateDisplayName,
  formatTemplateForDisplay,
} from '../services/templateUtils';
import { auctionEngine } from '../services/mockBackend';
import { useNavigate } from 'react-router-dom';

export const AuctionTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TemplateSortOption>('recentlyUsed');
  const [filterType, setFilterType] = useState<Types.AuctionType | 'all'>('all');
  const [filterCreator, setFilterCreator] = useState<'all' | 'system' | 'custom'>('all');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Types.AuctionTemplate | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  // Get all templates from backend
  const allTemplates = auctionEngine.getAllTemplates();

  // Filter and search
  const filteredTemplates = useMemo(() => {
    let templates = [...allTemplates];

    // Filter by type
    if (filterType !== 'all') {
      templates = filterTemplatesByType(templates, filterType);
    }

    // Filter by creator
    if (filterCreator === 'system') {
      templates = filterTemplatesByCreator(templates, undefined, true).filter(t => t.isSystemTemplate);
    } else if (filterCreator === 'custom') {
      templates = filterTemplatesByCreator(templates, undefined, false).filter(t => !t.isSystemTemplate);
    }

    // Filter favorites
    if (filterFavorites) {
      templates = getFavoriteTemplates(templates);
    }

    // Search
    if (searchQuery) {
      templates = searchTemplates(templates, searchQuery);
    }

    // Sort
    templates = sortTemplates(templates, sortBy);

    return templates;
  }, [allTemplates, filterType, filterCreator, filterFavorites, searchQuery, sortBy]);

  const handleUseTemplate = (template: Types.AuctionTemplate) => {
    // Record usage
    auctionEngine.recordTemplateUsage(template.templateId, 'current-user');
    // Navigate to create auction with template
    navigate(`/create-auction?templateId=${template.templateId}`);
  };

  const handleEditTemplate = (template: Types.AuctionTemplate) => {
    navigate(`/ams/auction-templates/${template.templateId}`);
  };

  const handleDuplicateTemplate = (template: Types.AuctionTemplate) => {
    const newTemplateId = auctionEngine.duplicateTemplate(template.templateId, 'current-user');
    setShowMenu(null);
  };

  const handleDeleteTemplate = (template: Types.AuctionTemplate) => {
    if (window.confirm(`Delete "${template.templateName}"? This action cannot be undone.`)) {
      try {
        auctionEngine.deleteTemplate(template.templateId);
        setShowMenu(null);
      } catch (err) {
        alert('Cannot delete system templates');
      }
    }
  };

  const handleToggleFavorite = (template: Types.AuctionTemplate) => {
    auctionEngine.toggleFavorite(template.templateId);
  };

  const handleCreateNew = () => {
    navigate('/ams/auctions/wizard?newTemplate=true');
  };

  const templateCard = (template: Types.AuctionTemplate) => {
    const displayData = formatTemplateForDisplay(template);
    const typeColor = getTemplateTypeColor(template.auctionConfiguration.auctionType);

    return (
      <div
        key={template.templateId}
        className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
      >
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{template.templateName}</h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                  {template.auctionConfiguration.auctionType}
                </span>
                {template.isSystemTemplate && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Official
                  </span>
                )}
                {template.isFavorite && (
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                )}
              </div>
            </div>
            <div className="relative">
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMenu(showMenu === template.templateId ? null : template.templateId)}
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>

              {/* Action Menu */}
              {showMenu === template.templateId && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-max">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2 border-b border-gray-100"
                    onClick={() => {
                      handleUseTemplate(template);
                      setShowMenu(null);
                    }}
                  >
                    <Zap className="w-4 h-4" />
                    Use Template
                  </button>
                  {!template.isSystemTemplate && (
                    <>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2 border-b border-gray-100"
                        onClick={() => {
                          handleEditTemplate(template);
                          setShowMenu(null);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2 border-b border-gray-100"
                        onClick={() => {
                          handleToggleFavorite(template);
                          setShowMenu(null);
                        }}
                      >
                        <Heart className="w-4 h-4" />
                        {template.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                      </button>
                    </>
                  )}
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2 border-b border-gray-100"
                    onClick={() => {
                      handleDuplicateTemplate(template);
                      setShowMenu(null);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  {!template.isSystemTemplate && (
                    <>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2 border-b border-gray-100"
                        onClick={() => setShowMenu(null)}
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-700 flex items-center gap-2"
                        onClick={() => {
                          handleDeleteTemplate(template);
                          setShowMenu(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {template.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-600 text-xs">Lanes</div>
              <div className="font-semibold text-gray-900">
                {template.auctionConfiguration.lanes.length}
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-xs">Used {displayData.usageCount}x</div>
              <div className="font-semibold text-gray-900">{formatLastUsed(template.lastUsedAt)}</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
            <div>By: {displayData.createdBy}</div>
          </div>
        </div>

        {/* Card Footer - Action Buttons */}
        <div className="bg-gray-50 p-3 border-t border-gray-200 flex gap-2">
          <button
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={() => handleUseTemplate(template)}
          >
            Use
          </button>
          <button
            className="px-3 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            onClick={() => navigate(`/ams/auction-templates/${template.templateId}`)}
          >
            View
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Auction Templates</h1>
              <p className="text-gray-600 mt-1">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
              onClick={handleCreateNew}
            >
              <Plus className="w-5 h-5" />
              Create New Template
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                <button
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Creator Filter */}
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterCreator}
                onChange={(e) => setFilterCreator(e.target.value as 'all' | 'system' | 'custom')}
              >
                <option value="all">All Templates</option>
                <option value="system">System Templates</option>
                <option value="custom">Custom Templates</option>
              </select>

              {/* Type Filter */}
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as Types.AuctionType | 'all')}
              >
                <option value="all">All Types</option>
                <option value={Types.AuctionType.REVERSE}>REVERSE</option>
                <option value={Types.AuctionType.SPOT}>SPOT</option>
                <option value={Types.AuctionType.LOT}>LOT</option>
                <option value={Types.AuctionType.BULK}>BULK</option>
                <option value={Types.AuctionType.REGION_LOT}>REGION_LOT</option>
              </select>

              {/* Favorites Filter */}
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterFavorites
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setFilterFavorites(!filterFavorites)}
              >
                <Heart className={`w-4 h-4 inline mr-1 ${filterFavorites ? 'fill-current' : ''}`} />
                Favorites
              </button>
            </div>

            {/* Sort */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TemplateSortOption)}
            >
              <option value="recentlyUsed">Recently Used</option>
              <option value="mostUsed">Most Used</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="dateCreated">Date Created</option>
            </select>
          </div>
        </div>

        {/* Templates Display */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search filters'
                : 'Get started by creating your first template or using a system template'}
            </p>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              onClick={handleCreateNew}
            >
              Create New Template
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => templateCard(template))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Lanes</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Used</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Used</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => {
                  const displayData = formatTemplateForDisplay(template);
                  return (
                    <tr key={template.templateId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{template.templateName}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTemplateTypeColor(template.auctionConfiguration.auctionType)}`}>
                          {template.auctionConfiguration.auctionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{template.auctionConfiguration.lanes.length}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{displayData.usageCount}x</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatLastUsed(template.lastUsedAt)}</td>
                      <td className="px-6 py-4 text-sm flex items-center gap-2">
                        <button
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                          onClick={() => handleUseTemplate(template)}
                        >
                          Use
                        </button>
                        <button
                          className="px-3 py-1 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded transition-colors"
                          onClick={() => navigate(`/ams/auction-templates/${template.templateId}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
