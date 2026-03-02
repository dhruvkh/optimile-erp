import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auctionEngine } from '../services/mockBackend';
import { Auction, AuctionLane, AuctionStatus, LaneStatus, AuctionRuleset, CreateAuctionRequest } from '../types';
import { Play, ExternalLink, Activity, Award } from 'lucide-react';
import { BulkLaneUploadModal } from './BulkLaneUploadModal';
import { useToast } from './common';

export function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [auction, setAuction] = useState<Auction | undefined>();
  const [lanes, setLanes] = useState<AuctionLane[]>([]);
  const [ruleset, setRuleset] = useState<AuctionRuleset | undefined>();
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const fetch = () => {
    if (!id) return;
    const auc = auctionEngine.getAuction(id);
    setAuction(auc);
    setLanes(auctionEngine.getLanesByAuction(id));
    if (auc) {
        setRuleset(auctionEngine.getRuleset(auc.rulesetId));
    }
  };

  useEffect(() => {
    fetch();
    const unsub = auctionEngine.subscribe(fetch);
    return unsub;
  }, [id]);

  if (!auction) return <div>Loading...</div>;

  const handlePublish = () => {
    try {
        auctionEngine.publishAuction(auction.id, 'ADMIN-USER');
    } catch(e) { alert((e as Error).message); }
  };

  const handleImportMoreLanes = (importedLanes: CreateAuctionRequest['lanes']) => {
    if (!id) return;
    try {
      auctionEngine.addLanesToAuction(id, importedLanes, 'ADMIN-USER');
      showToast({
        type: 'success',
        title: 'Lanes imported',
        message: `${importedLanes.length} lanes added to ${auction.name}`,
      });
      setShowBulkUpload(false);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Import failed',
        message: (error as Error).message,
      });
    }
  };

  return (
    <>
    <div>
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 flex justify-between items-start shadow-sm">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{auction.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">{auction.auctionType}</span>
                    <span>Status: <strong className="text-slate-900">{auction.status}</strong></span>
                    <span>ID: <span className="font-mono">{auction.id.split('-')[0]}</span></span>
                    {auction.originRFQId && (
                         <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Linked RFQ</span>
                    )}
                </div>
            </div>
            <div className="space-x-2 flex">
                <button onClick={() => setShowBulkUpload(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-blue-700">
                    <span>📤</span> <span>Import More Lanes</span>
                </button>
                {auction.status === AuctionStatus.DRAFT && (
                    <button onClick={handlePublish} className="bg-success text-white px-6 py-2 rounded font-bold hover:bg-emerald-600 shadow-lg shadow-success/20 transition-all">
                        Publish Auction
                    </button>
                )}
                 <Link to={`/award/${auction.id}`} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-slate-700">
                    <Award size={18} /> <span>Awarding</span>
                </Link>
            </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content: Lanes */}
          <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                  <span>Auction Lanes</span>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{lanes.length}</span>
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {lanes.map((lane, index) => {
                    const prevLane = index > 0 ? lanes[index-1] : null;
                    const canStart = !prevLane || prevLane.status === LaneStatus.CLOSED || prevLane.status === LaneStatus.AWARDED;

                    return (
                        <LaneRow 
                            key={lane.id} 
                            lane={lane} 
                            auctionStatus={auction.status} 
                            canStart={canStart}
                        />
                    );
                })}
              </div>
          </div>

          {/* Sidebar: Metadata & Rules */}
          <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Rules Applied</h3>
                  {ruleset ? (
                      <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                              <span className="text-slate-500">Min Decrement</span>
                              <span className="font-mono font-medium">₹{ruleset.minBidDecrement}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-500">Extension Trigger</span>
                              <span className="font-mono font-medium">{ruleset.timerExtensionThresholdSeconds}s</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-500">Extension Added</span>
                              <span className="font-mono font-medium">+{ruleset.timerExtensionSeconds}s</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-500">Rank Visible</span>
                              <span className={`font-medium ${ruleset.allowRankVisibility ? 'text-green-600' : 'text-red-600'}`}>
                                  {ruleset.allowRankVisibility ? 'YES' : 'NO'}
                              </span>
                          </div>
                      </div>
                  ) : (
                      <div className="text-slate-400 italic text-sm">No ruleset loaded.</div>
                  )}
              </div>
          </div>

      </div>
    </div>

    <BulkLaneUploadModal
      isOpen={showBulkUpload}
      onClose={() => setShowBulkUpload(false)}
      onImport={handleImportMoreLanes}
      existingLaneNames={lanes.map((l) => l.laneName)}
      title="Import More Lanes"
    />
    </>
  );
}

function LaneRow({ lane, auctionStatus, canStart }: { lane: AuctionLane, auctionStatus: AuctionStatus, canStart: boolean }) {
    const isRunning = lane.status === LaneStatus.RUNNING;
    const isPending = lane.status === LaneStatus.PENDING;
    const isClosed = lane.status === LaneStatus.CLOSED || lane.status === LaneStatus.AWARDED;

    const startLane = () => {
        try {
            auctionEngine.startLane(lane.id, 'ADMIN-USER');
        } catch(e) { alert((e as Error).message); }
    };

    return (
        <div className={`bg-white border rounded-lg p-4 flex items-center justify-between transition-all ${isRunning ? 'border-accent ring-1 ring-accent shadow-md' : 'border-slate-200'}`}>
            <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    isClosed ? 'bg-slate-100 text-slate-400' : 
                    isRunning ? 'bg-green-100 text-green-700' : 
                    'bg-slate-100 text-slate-700'
                }`}>
                    {lane.sequenceOrder}
                </div>
                <div>
                    <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-800">{lane.laneName}</h3>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            isRunning ? 'bg-red-100 text-red-600 animate-pulse' : 
                            isClosed ? 'bg-slate-100 text-slate-500' : 
                            'bg-blue-50 text-blue-600'
                        }`}>
                            {lane.status}
                        </span>
                        {lane.truckType && (
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{lane.truckType}</span>
                        )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 space-x-3">
                         <span>Base: ₹{lane.basePrice}</span>
                         <span>•</span>
                         <span>Duration: {lane.timerDurationSeconds}s</span>
                         {lane.currentLowestBid && (
                             <>
                                <span>•</span>
                                <span className="text-green-600 font-bold">Best: ₹{lane.currentLowestBid}</span>
                             </>
                         )}
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                {isPending && (
                    <button 
                        onClick={startLane} 
                        disabled={!canStart || auctionStatus !== AuctionStatus.PUBLISHED && auctionStatus !== AuctionStatus.RUNNING}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            canStart && (auctionStatus === AuctionStatus.PUBLISHED || auctionStatus === AuctionStatus.RUNNING)
                            ? 'bg-accent text-white hover:bg-blue-600' 
                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                        title={!canStart ? "Previous lane must be closed" : "Start this lane"}
                    >
                        <Play size={14} /> <span>Start</span>
                    </button>
                )}
                
                {isRunning && (
                    <Link to="#" className="flex items-center space-x-1 px-3 py-1.5 rounded text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                        <Activity size={14} /> <span>Live Monitor</span>
                    </Link>
                )}

                <Link to="#" target="_blank" className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded" title="Vendor View">
                    <ExternalLink size={16} />
                </Link>
            </div>
        </div>
    );
}
