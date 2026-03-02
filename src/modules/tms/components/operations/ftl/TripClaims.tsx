
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Claim, CLAIM_TYPES_DEF, ClaimType } from './types';
import { 
  AlertCircle, Camera, Upload, CheckCircle, X, ChevronRight, 
  FileText, ShieldAlert, DollarSign, MessageSquare 
} from 'lucide-react';

const INITIAL_CLAIMS: Claim[] = [
  {
    id: 'CLM-1001',
    tripId: 'TR-2024-1001',
    type: 'DAMAGE',
    description: '2 cartons damaged during transit - visible dents',
    claimedAmount: 5000,
    status: 'Under Review',
    filedBy: { name: 'Acme Corp (Customer)', role: 'Client', time: '2024-02-12 10:00' },
    evidence: ['https://images.unsplash.com/photo-1626245969230-ae0593b4a2d3?auto=format&fit=crop&w=150&q=80'],
    resolutionNotes: 'Driver states warehouse mishandling.'
  }
];

export const TripClaims: React.FC<{ tripId: string }> = ({ tripId }) => {
  const [view, setView] = useState<'list' | 'new' | 'resolve'>('list');
  const [claims, setClaims] = useState<Claim[]>(INITIAL_CLAIMS);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // New Claim Form State
  const [newClaim, setNewClaim] = useState<Partial<Claim>>({
    type: 'DAMAGE',
    description: '',
    claimedAmount: 0,
    evidence: []
  });

  // Resolution Form State
  const [resolution, setResolution] = useState({
    approvedAmount: 0,
    notes: '',
    method: 'Deduct from Invoice' as const
  });

  const handleFileClaim = () => {
    if (!newClaim.description || !newClaim.claimedAmount) return;
    const claim: Claim = {
        id: `CLM-${Math.floor(Math.random() * 10000)}`,
        tripId,
        type: newClaim.type as ClaimType,
        description: newClaim.description,
        claimedAmount: Number(newClaim.claimedAmount),
        status: 'Pending',
        filedBy: { name: 'Ops Manager', role: 'Internal', time: new Date().toLocaleString() },
        evidence: newClaim.evidence || [],
    };
    setClaims([...claims, claim]);
    setView('list');
    setNewClaim({ type: 'DAMAGE', description: '', claimedAmount: 0, evidence: [] });
  };

  const openResolution = (claim: Claim) => {
    setSelectedClaim(claim);
    setResolution({
        approvedAmount: claim.claimedAmount,
        notes: claim.resolutionNotes || '',
        method: 'Deduct from Invoice'
    });
    setView('resolve');
  };

  const handleResolve = (status: 'Approved' | 'Rejected') => {
    if (!selectedClaim) return;
    
    setClaims(prev => prev.map(c => c.id === selectedClaim.id ? {
        ...c,
        status,
        approvedAmount: status === 'Approved' ? Number(resolution.approvedAmount) : 0,
        resolutionNotes: resolution.notes,
        settlementMethod: status === 'Approved' ? resolution.method : undefined
    } : c));
    setView('list');
    setSelectedClaim(null);
  };

  // --- NEW CLAIM FORM ---
  if (view === 'new') {
    return (
      <div className="space-y-6">
         <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="font-bold text-gray-900">File New Claim</h3>
            <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">
               <X className="h-5 w-5" />
            </button>
         </div>

         <div className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Claim Type</label>
               <div className="grid grid-cols-2 gap-3">
                  {Object.entries(CLAIM_TYPES_DEF).map(([key, def]) => (
                     <div 
                       key={key}
                       onClick={() => setNewClaim({...newClaim, type: key as ClaimType})}
                       className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                          newClaim.type === key 
                             ? 'border-red-500 bg-red-50 ring-1 ring-red-500' 
                             : 'border-gray-200 hover:bg-gray-50'
                       }`}
                     >
                        <span className="text-2xl mr-3">{def.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{def.name}</span>
                     </div>
                  ))}
               </div>
            </div>

            <Input 
               label="Claim Description" 
               placeholder="Describe damage, shortage or issue..."
               value={newClaim.description}
               onChange={(e) => setNewClaim({...newClaim, description: e.target.value})}
            />

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
               <label className="block text-sm font-medium text-gray-700 mb-2">Financial Impact</label>
               <Input 
                  label="Claimed Amount (₹)" 
                  type="number"
                  value={newClaim.claimedAmount}
                  onChange={(e) => setNewClaim({...newClaim, claimedAmount: Number(e.target.value)})}
               />
               <p className="text-xs text-gray-500 mt-2">
                  This amount will be held against the trip revenue until resolved.
               </p>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Evidence (Required)</label>
               <div className="grid grid-cols-2 gap-4">
                  <button className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-gray-500">
                     <Camera className="h-6 w-6 mb-1" />
                     <span className="text-xs">Take Photo</span>
                  </button>
                  <button className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-gray-500">
                     <Upload className="h-6 w-6 mb-1" />
                     <span className="text-xs">Upload Document</span>
                  </button>
               </div>
            </div>
         </div>

         <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" className="flex-1" onClick={() => setView('list')}>Cancel</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleFileClaim}>Submit Claim</Button>
         </div>
      </div>
    );
  }

  // --- RESOLUTION VIEW ---
  if (view === 'resolve' && selectedClaim) {
     return (
        <div className="space-y-6">
           <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-900">Resolve Claim #{selectedClaim.id}</h3>
              <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">
                 <X className="h-5 w-5" />
              </button>
           </div>

           {/* Claim Details Summary */}
           <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="flex items-start">
                 <div className="text-2xl mr-3">{CLAIM_TYPES_DEF[selectedClaim.type].icon}</div>
                 <div>
                    <h4 className="font-bold text-red-900">{CLAIM_TYPES_DEF[selectedClaim.type].name}</h4>
                    <p className="text-sm text-red-800 mt-1">{selectedClaim.description}</p>
                    <p className="text-xs text-red-700 mt-2">Filed by {selectedClaim.filedBy.name} on {selectedClaim.filedBy.time}</p>
                 </div>
              </div>
              <div className="mt-4 pt-3 border-t border-red-200 flex justify-between items-center">
                 <span className="text-sm font-medium text-red-800">Claimed Amount:</span>
                 <span className="text-lg font-bold text-red-900">₹ {selectedClaim.claimedAmount.toLocaleString()}</span>
              </div>
           </div>

           {/* Evidence Viewer */}
           <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">Evidence</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                 {selectedClaim.evidence.map((url, i) => (
                    <img key={i} src={url} alt="Evidence" className="h-20 w-20 rounded object-cover border border-gray-200" />
                 ))}
                 {selectedClaim.evidence.length === 0 && <span className="text-xs text-gray-500 italic">No evidence uploaded</span>}
              </div>
           </div>

           {/* Resolution Form */}
           <div className="space-y-4 pt-2">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Investigation & Decision</h4>
              
              <Input 
                 label="Approved Deduction Amount (₹)" 
                 type="number"
                 value={resolution.approvedAmount}
                 onChange={(e) => setResolution({...resolution, approvedAmount: Number(e.target.value)})}
              />

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Method</label>
                 <select 
                    className="block w-full border-gray-300 rounded-md text-sm py-2 px-3 border"
                    value={resolution.method}
                    onChange={(e) => setResolution({...resolution, method: e.target.value as any})}
                 >
                    <option>Deduct from Invoice</option>
                    <option>Issue Refund</option>
                    <option>File Insurance Claim</option>
                 </select>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes / Justification</label>
                 <textarea 
                    className="block w-full border-gray-300 rounded-md text-sm py-2 px-3 border focus:ring-primary focus:border-primary"
                    rows={3}
                    value={resolution.notes}
                    onChange={(e) => setResolution({...resolution, notes: e.target.value})}
                    placeholder="e.g. Damage due to improper packing, partial liability accepted."
                 ></textarea>
              </div>
           </div>

           <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleResolve('Rejected')}>
                 Reject Claim
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleResolve('Approved')}>
                 Approve & Deduct
              </Button>
           </div>
        </div>
     );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
             <ShieldAlert className="h-5 w-5 text-gray-500" />
             <h3 className="font-bold text-gray-900">Trip Claims & Incidents</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => setView('new')} className="text-red-600 border-red-200 hover:bg-red-50">
             <AlertCircle className="h-4 w-4 mr-2" /> File Claim
          </Button>
       </div>

       {claims.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
             <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2 opacity-50" />
             <p className="text-sm text-gray-500 font-medium">No claims filed for this trip.</p>
             <p className="text-xs text-gray-400">Good job!</p>
          </div>
       ) : (
          <div className="space-y-3">
             {claims.map((claim) => {
                const def = CLAIM_TYPES_DEF[claim.type];
                return (
                   <Card key={claim.id} className="border-l-4 border-l-red-500 p-0 overflow-hidden">
                      <div className="p-4">
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                               <span className="text-xl mr-2">{def.icon}</span>
                               <div>
                                  <h4 className="font-bold text-gray-900 text-sm">{def.name}</h4>
                                  <span className="text-xs text-gray-500">{claim.id}</span>
                               </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                               claim.status === 'Approved' ? 'bg-green-100 text-green-800' :
                               claim.status === 'Rejected' ? 'bg-gray-100 text-gray-600 line-through' :
                               'bg-yellow-100 text-yellow-800'
                            }`}>
                               {claim.status}
                            </span>
                         </div>
                         
                         <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">{claim.description}</p>
                         
                         <div className="flex justify-between items-end">
                            <div className="text-xs text-gray-500">
                               <p>Filed: {claim.filedBy.time}</p>
                               {claim.approvedAmount ? (
                                  <p className="text-green-600 font-bold mt-1">Approved: ₹ {claim.approvedAmount.toLocaleString()}</p>
                               ) : (
                                  <p>Claimed: ₹ {claim.claimedAmount.toLocaleString()}</p>
                               )}
                            </div>
                            
                            {claim.status === 'Pending' || claim.status === 'Under Review' ? (
                               <Button size="sm" onClick={() => openResolution(claim)}>
                                  Resolve
                               </Button>
                            ) : (
                               <Button size="sm" variant="outline" onClick={() => openResolution(claim)}>
                                  View Details
                               </Button>
                            )}
                         </div>
                      </div>
                   </Card>
                );
             })}
          </div>
       )}
    </div>
  );
};
