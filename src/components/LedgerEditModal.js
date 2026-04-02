import { createPortal } from 'react-dom';
import { Edit3, X, Save, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LedgerEditModal({ isOpen, onClose, onUpdateSuccess, tx }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
    if (tx) {
        setAmount(tx.amount || '');
        setType(tx.type || '');
    }
    return () => setMounted(false);
  }, [tx]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tx.source !== 'payment') {
        alert("System logs cannot be edited directly. Please delete and perform the action again if needed.");
        onClose();
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          amount: parseFloat(amount),
          payment_type: type.toLowerCase().replace(/ /g, '_')
        })
        .eq('id', tx.id);

      if (updateError) throw updateError;

      // Log the edit
      await supabase.from('audit_logs').insert({
        activity: 'LEDGER_ENTRY_EDITED',
        details: { tx_id: tx.id, old_amount: tx.amount, new_amount: amount }
      });

      onUpdateSuccess();
      onClose();
    } catch (err) {
      console.error('Update Error:', err);
      setError(err.message || 'Failed to update entry');
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Edit Transaction</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>For {tx.name}</p>
          </div>
          <button onClick={onClose} style={{ 
            background: 'var(--muted)', border: 'none', color: 'var(--muted-foreground)', 
            cursor: 'pointer', width: '32px', height: '32px', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', borderRadius: '50%' 
          }}>
            <X size={18} />
          </button>
        </div>

        {tx.source !== 'payment' ? (
           <div className="modal-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
             <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
               <AlertCircle size={48} color="var(--primary)" />
             </div>
             <h3 style={{ marginBottom: '8px' }}>Read-Only Record</h3>
             <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', lineHeight: '1.5' }}>
               System logs (Enrollments/Removals) are read-only and cannot be edited. Please use the Delete option to remove incorrect logs.
             </p>
             <button onClick={onClose} className="ios-button" style={{ marginTop: '24px', width: '100%', background: 'var(--secondary)' }}>Close</button>
           </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="modal-body">
              {error && (
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="field-group">
                <label className="field-label">Amount (₹)</label>
                <input 
                  type="number" 
                  className="ios-input" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  required 
                  style={{ fontSize: '1.25rem', fontWeight: 'bold' }}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Payment Type</label>
                <input 
                  type="text" 
                  className="ios-input" 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="ios-button" style={{ flex: 1, background: 'var(--muted)', color: 'var(--foreground)' }}>
                Cancel
              </button>
              <button type="submit" className="ios-button ios-button-primary" style={{ flex: 2, padding: '16px' }} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
