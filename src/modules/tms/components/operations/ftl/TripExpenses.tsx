
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { EXPENSE_CATEGORIES, ExpenseCategory } from './types';
import {
  Plus, X, Camera, MapPin, Upload, FileText,
  Download, ArrowLeft, Loader2, Image as ImageIcon
} from 'lucide-react';
import { useOperationalData, TripExpense } from '../../../../../shared/context/OperationalDataContext';

export const TripExpenses: React.FC<{ tripId: string }> = ({ tripId }) => {
  const { getTripExpenses, addTripExpense, updateTripExpense } = useOperationalData();
  const expenses = getTripExpenses(tripId);

  const [view, setView] = useState<'list' | 'add'>('list');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved'>('All');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isAdvance, setIsAdvance] = useState(false);
  const [advanceType, setAdvanceType] = useState<'fuel' | 'driver_batta' | 'toll' | 'vendor_advance' | 'other'>('vendor_advance');

  const [newExpense, setNewExpense] = useState<Partial<TripExpense>>({
    category: 'FUEL',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    amount: 0
  });
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = expenses.filter(e => e.status === 'Approved').reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = expenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0);

  const handleApprove = (id: string) => {
    updateTripExpense(tripId, id, { status: 'Approved' });
  };

  const handleReject = (id: string) => {
    setRejectingId(id);
    setRejectReason('');
  };

  const simulateLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      setNewExpense(prev => ({
        ...prev,
        location: { name: 'Detected Location', address: 'NH-48, Near Surat' }
      }));
      setIsLocating(false);
    }, 1500);
  };

  const handleSubmitExpense = () => {
    if (!newExpense.amount || !newExpense.category) {
      setSubmitError('Please enter amount and category.');
      return;
    }
    setSubmitError('');
    const expense: TripExpense = {
      id: `EXP-${Date.now()}`,
      tripId,
      category: newExpense.category as ExpenseCategory,
      description: newExpense.description || (isAdvance ? `Advance – ${advanceType.replace('_', ' ')}` : EXPENSE_CATEGORIES[newExpense.category as ExpenseCategory]?.name || newExpense.category),
      amount: Number(newExpense.amount),
      quantity: newExpense.quantity ? Number(newExpense.quantity) : undefined,
      rate: newExpense.rate ? Number(newExpense.rate) : undefined,
      date: newExpense.date || '',
      time: newExpense.time || '',
      location: newExpense.location,
      status: 'Pending',
      isAdvance,
      advanceType: isAdvance ? advanceType : undefined,
      submittedBy: { name: 'Current User', role: 'Ops', time: new Date().toLocaleString() },
      receiptUrl: receiptImage || undefined
    };
    addTripExpense(tripId, expense);
    setView('list');
    setNewExpense({ category: 'FUEL', date: new Date().toISOString().split('T')[0], amount: 0 });
    setReceiptImage(null);
    setIsAdvance(false);
    setAdvanceType('vendor_advance');
  };

  const filteredExpenses = filter === 'All' ? expenses : expenses.filter(e => e.status === filter);

  if (view === 'add') {
    return (
      <div className="bg-gray-50 min-h-[500px] flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm">
          <button onClick={() => setView('list')} className="mr-3 text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h3 className="font-bold text-gray-900">Add Trip Expense</h3>
        </div>

        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Expense Category</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(EXPENSE_CATEGORIES).map((cat) => (
                <button
                  key={cat.code}
                  onClick={() => setNewExpense({ ...newExpense, category: cat.code })}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    newExpense.category === cat.code
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  <span className="text-[10px] font-medium text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
              <input
                type="number"
                className="block w-full text-2xl font-bold border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                value={newExpense.amount || ''}
                onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
              />
            </div>

            {newExpense.category === 'FUEL' && (
              <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-md">
                <div>
                  <label className="block text-xs font-medium text-blue-800 mb-1">Quantity (L)</label>
                  <input type="number" className="block w-full text-sm border-blue-200 rounded" placeholder="Litres"
                    value={newExpense.quantity || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, quantity: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-800 mb-1">Rate (₹/L)</label>
                  <input type="number" className="block w-full text-sm border-blue-200 rounded" placeholder="Price"
                    value={newExpense.rate || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, rate: Number(e.target.value) })} />
                </div>
                <p className="col-span-2 text-[10px] text-blue-600">Amount should equal Quantity × Rate</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={2} className="block w-full text-sm border-gray-300 rounded-md" placeholder="Details"
                value={newExpense.description || ''}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
            </div>

            {/* Advance Request Toggle */}
            <div className={`p-3 rounded-lg border ${isAdvance ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">Request as Advance</p>
                  <p className="text-xs text-gray-500 mt-0.5">Requires HO approval before payment is released</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdvance(!isAdvance)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${isAdvance ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${isAdvance ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {isAdvance && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-orange-800 mb-1.5 uppercase">Advance Type</label>
                  <select
                    value={advanceType}
                    onChange={(e) => setAdvanceType(e.target.value as typeof advanceType)}
                    className="w-full text-sm border border-orange-200 bg-white rounded-md px-2 py-1.5 focus:ring-1 focus:ring-orange-400 focus:border-orange-400"
                  >
                    <option value="vendor_advance">Vendor Freight Advance</option>
                    <option value="fuel">Fuel Advance</option>
                    <option value="driver_batta">Driver Batta</option>
                    <option value="toll">Toll Advance</option>
                    <option value="other">Other Advance</option>
                  </select>
                  <p className="text-[11px] text-orange-600 mt-1.5">This will appear in the HO Approval Queue for authorisation.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Date" type="date" value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
              <Input label="Time" type="time" value={newExpense.time}
                onChange={(e) => setNewExpense({ ...newExpense, time: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              {newExpense.location ? (
                <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-100 text-sm">
                  <div className="flex items-center text-green-800">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate max-w-[200px]">{newExpense.location.name}</span>
                  </div>
                  <button onClick={simulateLocation} className="text-xs text-green-600 hover:underline">Refresh</button>
                </div>
              ) : (
                <button onClick={simulateLocation} disabled={isLocating}
                  className="w-full flex items-center justify-center py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                  {isLocating ? "Detecting GPS..." : "Auto-Detect Location"}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Receipt Evidence</label>
            {receiptImage ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200 h-48 bg-black">
                <img src={receiptImage} alt="Receipt" className="w-full h-full object-contain" />
                <button onClick={() => setReceiptImage(null)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setReceiptImage('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80')}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                  <Camera className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Take Photo</span>
                </button>
                <button onClick={() => setReceiptImage('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80')}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                  <Upload className="h-8 w-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Upload File</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          {submitError && <p className="text-red-500 text-sm mb-2">{submitError}</p>}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setView('list')}>Cancel</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleSubmitExpense}>Submit Expense</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="grid grid-cols-3 gap-4 p-4 pb-0">
        <Card className="p-3 border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
          <p className="text-lg font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
        </Card>
        <Card className="p-3 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 uppercase font-bold">Approved</p>
          <p className="text-lg font-bold text-green-700">₹{approvedAmount.toLocaleString()}</p>
        </Card>
        <Card className="p-3 border-l-4 border-l-yellow-500">
          <p className="text-xs text-gray-500 uppercase font-bold">Pending</p>
          <p className="text-lg font-bold text-yellow-700">₹{pendingAmount.toLocaleString()}</p>
        </Card>
      </div>

      {approvedAmount > 0 && (
        <div className="mx-4 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm flex items-center justify-between">
          <span className="text-green-800 font-medium">Trip cost updated from approved expenses</span>
          <span className="font-bold text-green-900">₹{approvedAmount.toLocaleString()} recorded in Finance</span>
        </div>
      )}

      <div className="px-4 py-4 flex justify-between items-center">
        <div className="flex bg-white rounded-md shadow-sm border border-gray-200 p-1">
          {(['All', 'Pending', 'Approved'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded ${filter === f ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline"><Download className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => setView('add')}>
            <Plus className="h-4 w-4 mr-1" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{filter === 'All' ? 'No expenses yet. Click "Add Expense" to start.' : `No ${filter.toLowerCase()} expenses.`}</p>
          </div>
        ) : (
          filteredExpenses.map(expense => {
            const catDef = EXPENSE_CATEGORIES[expense.category as ExpenseCategory];
            return (
              <div key={expense.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow relative">
                <div className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  expense.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' :
                  expense.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                  'bg-yellow-50 text-yellow-700 border-yellow-100'
                }`}>
                  {expense.status}
                </div>
                <div className="flex items-start">
                  <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-xl mr-3 border border-gray-100">
                    {catDef?.icon ?? '📋'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 pr-20">
                      <h4 className="text-sm font-bold text-gray-900">{catDef?.name ?? expense.category}</h4>
                      {expense.isAdvance && (
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded uppercase">
                          Advance
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{expense.description}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {expense.location?.name || 'Unknown'}</span>
                      <span>{expense.date} • {expense.time}</span>
                      {expense.quantity && <span>{expense.quantity}L @ ₹{expense.rate}/L</span>}
                    </div>
                    {expense.receiptUrl && (
                      <a href="#" className="mt-2 text-xs text-blue-600 hover:underline flex items-center">
                        <ImageIcon className="h-3 w-3 mr-1" /> View Receipt
                      </a>
                    )}
                  </div>
                  <span className="text-lg font-bold text-gray-900">₹{expense.amount.toLocaleString()}</span>
                </div>
                {expense.status === 'Pending' && rejectingId === expense.id ? (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-red-700">Reason for rejection:</p>
                      <textarea
                        rows={2}
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="w-full text-sm border border-red-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-400"
                        placeholder="Enter reason…"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-red-600 hover:bg-red-700"
                          onClick={() => {
                            if (rejectReason.trim()) {
                              updateTripExpense(tripId, expense.id, { status: 'Rejected', rejectionReason: rejectReason.trim() });
                              setRejectingId(null);
                              setRejectReason('');
                            }
                          }}
                        >
                          Confirm Reject
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setRejectingId(null); setRejectReason(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : expense.status === 'Pending' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleReject(expense.id)}>
                      Reject
                    </Button>
                    <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleApprove(expense.id)}>
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
