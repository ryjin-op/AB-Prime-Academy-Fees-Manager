'use client';

import { createPortal } from 'react-dom';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, studentName, loading }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '20px', 
          background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <AlertTriangle size={32} />
        </div>
        
        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Delete Student?</h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
          Are you sure you want to delete <strong>{studentName}</strong>? This will permanently remove all payment history and records.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={onConfirm}
            className="ios-button" 
            style={{ width: '100%', background: 'var(--danger)', color: 'white', fontWeight: '700' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Delete Permanently'}
          </button>
          <button 
            onClick={onClose}
            className="ios-button" 
            style={{ width: '100%', background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
