import { createPortal } from 'react-dom';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LedgerDeleteModal({ isOpen, onClose, onConfirm, tx, loading }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header" style={{ flexDirection: 'column', paddingBottom: '16px' }}>
          <div className="modal-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', width: '64px', height: '64px', borderRadius: '20px' }}>
            <Trash2 size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginTop: '16px' }}>Confirm Deletion</h2>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '8px', textAlign: 'center' }}>
            Are you sure you want to remove this record from the ledger?
          </p>
        </div>

        <div className="modal-body">
          <div className="ios-card" style={{ background: 'var(--secondary)', border: 'none', padding: '16px' }}>
            <div className="field-label" style={{ marginBottom: '8px' }}>Record Details</div>
            <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{tx.name}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--primary)', marginTop: '4px' }}>{tx.type} • ₹{tx.amount || 0}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>{tx.date}</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(234, 179, 8, 0.1)', color: '#854d0e', borderRadius: '16px', fontSize: '0.85rem' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <p style={{ lineHeight: '1.4' }}>This action is irreversible and will update the transaction history metrics.</p>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            onClick={onClose} 
            className="ios-button" 
            style={{ flex: 1, background: 'var(--muted)', color: 'var(--foreground)' }}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(tx)} 
            className="ios-button" 
            style={{ flex: 1, background: 'var(--danger)', color: 'white' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Delete Record'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
