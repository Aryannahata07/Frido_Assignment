'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CreateRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRequestModal({ onClose, onSuccess }: CreateRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [itemId, setItemId] = useState('');
  const [units, setUnits] = useState('1');
  const [reason, setReason] = useState('Defective');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/items')
        ]);
        if (cRes.ok) setCustomers(await cRes.json());
        if (iRes.ok) setItems(await iRes.json());
      } catch (e) {}
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (customerId) {
      fetch(`/api/orders?customerId=${customerId}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setOrders(data);
          setOrderId(''); // Reset order when customer changes
        });
    } else {
      setOrders([]);
      setOrderId('');
    }
  }, [customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !orderId || !itemId || !units || !reason) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          orderId,
          itemId,
          units,
          reason,
          notes
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create request');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Raise Return Request</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <form id="create-form" onSubmit={handleSubmit} className="space-y-5 text-black">
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Customer <span className="text-red-500">*</span></label>
              <select 
                value={customerId} 
                onChange={e => setCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 bg-white"
              >
                <option value="">Select a customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Order <span className="text-red-500">*</span></label>
              <select 
                value={orderId} 
                onChange={e => setOrderId(e.target.value)}
                required
                disabled={!customerId}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 text-slate-900 bg-white"
              >
                <option value="">{customerId ? "Select an order..." : "Select a customer first"}</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Item to Return <span className="text-red-500">*</span></label>
              <select 
                value={itemId} 
                onChange={e => setItemId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 bg-white"
              >
                <option value="">Select an item...</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} (${i.price})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Units <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  min="1"
                  value={units}
                  onChange={e => setUnits(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Reason <span className="text-red-500">*</span></label>
                <select 
                  value={reason} 
                  onChange={e => setReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 bg-white"
                >
                  <option value="Defective">Defective</option>
                  <option value="WrongItem">Wrong Item</option>
                  <option value="BuyerRemorse">Buyer Remorse</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Initial Note</label>
              <textarea 
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any helpful context..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-slate-900 bg-white placeholder-slate-400"
              ></textarea>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="create-form"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Raise Request
          </button>
        </div>

      </div>
    </div>
  );
}
