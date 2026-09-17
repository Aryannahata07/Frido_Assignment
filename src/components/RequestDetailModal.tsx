'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Loader2, Save, Send, Trash2 } from 'lucide-react';

export default function RequestDetailModal({ requestId, onClose, onRefresh }: { requestId: string, onClose: () => void, onRefresh: () => void }) {
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [status, setStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  
  const [units, setUnits] = useState('');
  const [reason, setReason] = useState('');
  
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/requests/${requestId}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
        setStatus(data.status);
        setResolution(data.resolution || '');
        setRefundAmount(data.refundAmount ? data.refundAmount.toString() : '');
        setUnits(data.units.toString());
        setReason(data.reason);
      }
    } catch (e) {
      setError('Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [requestId]);

  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolution: resolution || undefined,
          refundAmount: resolution === 'Refund' ? refundAmount : undefined,
          units,
          reason
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update request');
      }
      
      onRefresh();
      fetchDetail();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent })
      });
      if (res.ok) {
        setNoteContent('');
        fetchDetail();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this request?')) return;
    
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete request');
      }
    } catch (e) {
      setError('Failed to delete request');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!request) return null;

  const isDecided = ['Approved', 'Rejected', 'Completed'].includes(request.status);

  // Status transitions
  const validTransitions: Record<string, string[]> = {
    'Open': ['Open', 'InReview'],
    'InReview': ['InReview', 'Approved', 'Rejected'],
    'Approved': ['Approved', 'Completed'],
    'Rejected': ['Rejected'],
    'Completed': ['Completed']
  };

  const allowedStatuses = validTransitions[request.status] || [request.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-800">{request.reference}</h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                {request.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">Raised on {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}</p>
          </div>
          <div className="flex items-center gap-2">
            {(request.status === 'Open' || request.status === 'Rejected') && (
              <button 
                onClick={handleDelete}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove Request"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Main Details Panel */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-slate-100">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Customer & Item Info */}
              <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Customer</p>
                  <p className="font-medium text-slate-900">{request.customer.name}</p>
                  <p className="text-sm text-slate-500">{request.customer.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Order & Item</p>
                  <p className="font-medium text-slate-900">{request.order.orderNumber}</p>
                  <p className="text-sm text-slate-500">{request.item.name} (${request.item.price})</p>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">Request Details</h3>
                <div className="grid grid-cols-2 gap-4 text-black">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Units</label>
                    <input 
                      type="number"
                      value={units}
                      onChange={e => setUnits(e.target.value)}
                      disabled={isDecided}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Reason</label>
                    <select 
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      disabled={isDecided}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="Defective">Defective</option>
                      <option value="WrongItem">Wrong Item</option>
                      <option value="BuyerRemorse">Buyer Remorse</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Resolution & Status */}
              <div className="space-y-4 pt-4 text-black">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">Resolution</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Current Status</label>
                    <select 
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {allowedStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Resolution Type</label>
                    <select 
                      value={resolution}
                      onChange={e => setResolution(e.target.value)}
                      disabled={request.status === 'Completed' || request.status === 'Rejected'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="">None yet</option>
                      <option value="Refund">Refund</option>
                      <option value="Replacement">Replacement</option>
                      <option value="StoreCredit">Store Credit</option>
                    </select>
                  </div>

                  {resolution === 'Refund' && (
                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                      <label className="text-sm font-medium text-slate-700">Refund Amount ($)</label>
                      <input 
                        type="number"
                        step="0.01"
                        value={refundAmount}
                        onChange={e => setRefundAmount(e.target.value)}
                        disabled={request.status === 'Completed' || request.status === 'Rejected'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleUpdate}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Notes Sidebar */}
          <div className="w-full md:w-80 bg-slate-50 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10">
              <h3 className="font-semibold text-slate-800">Activity & Notes</h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {request.notes.map((note: any) => (
                <div key={note.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 text-sm">
                  <p className="text-slate-800">{note.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{format(new Date(note.createdAt), 'MMM d, h:mm a')}</p>
                </div>
              ))}
              {request.notes.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No notes yet.</p>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-200 text-black">
              <textarea 
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mb-2"
              ></textarea>
              <button 
                onClick={handleAddNote}
                disabled={!noteContent.trim() || addingNote}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70"
              >
                {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Add Note
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
