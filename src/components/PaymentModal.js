import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, IndianRupee, Wallet, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PaymentModal({ student, isOpen, onClose, onPaymentSuccess }) {
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const paidAmount = parseFloat(amount);
    
    if (isNaN(paidAmount) || paidAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate new balances
      let newTotalDue = student.total_due;
      let newAdvanceBalance = student.advance_balance;
      let paidTowardsDue = 0;
      let addedToAdvance = 0;

      if (paidAmount <= newTotalDue) {
        // Paying towards existing debt
        paidTowardsDue = paidAmount;
        newTotalDue = newTotalDue - paidAmount;
      } else {
        // Paying more than debt
        paidTowardsDue = newTotalDue;
        addedToAdvance = paidAmount - newTotalDue;
        newTotalDue = 0;
        newAdvanceBalance = newAdvanceBalance + addedToAdvance;
      }

      // Update student record
      const { error: updateError } = await supabase
        .from('students')
        .update({
          total_due: newTotalDue,
          advance_balance: newAdvanceBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (updateError) throw updateError;

      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          student_id: student.id,
          amount: paidAmount,
          payment_type: 'fee_payment',
          month_for: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        });

      if (paymentError) throw paymentError;

      // Record audit log
      await supabase
        .from('audit_logs')
        .insert({
          activity: 'Payment Processed',
          details: {
            student_name: student.name,
            amount: paidAmount,
            paid_towards_due: paidTowardsDue,
            added_to_advance: addedToAdvance
          }
        });

      onPaymentSuccess({
        ...student,
        total_due: newTotalDue,
        advance_balance: newAdvanceBalance
      });
      onClose();
    } catch (err) {
      console.error('Payment Error:', err);
      setError(err.message || 'Failed to process payment.');
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Record Payment</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>For {student.name}</p>
          </div>
          <button onClick={onClose} style={{ 
            background: 'var(--muted)', border: 'none', color: 'var(--muted-foreground)', 
            cursor: 'pointer', width: '32px', height: '32px', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', borderRadius: '50%' 
          }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="ios-card" style={{ background: 'var(--secondary)', border: 'none', padding: '16px' }}>
              <div className="field-label" style={{ marginBottom: '4px' }}>Balance Due</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: student.total_due > 0 ? 'var(--danger)' : 'inherit' }}>
                ₹{student.total_due.toLocaleString()}
              </div>
            </div>
            <div className="ios-card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: 'none', padding: '16px' }}>
              <div className="field-label" style={{ marginBottom: '4px', color: 'var(--success)' }}>Advance</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>
                ₹{student.advance_balance.toLocaleString()}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="field-group">
              <label className="field-label">Payment Amount</label>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                    position: 'absolute', left: '16px', top: '50%', 
                    transform: 'translateY(-50%)', 
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: 'var(--primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <IndianRupee size={16} />
                </div>
                <input 
                  type="number" 
                  className="ios-input" 
                  style={{ paddingLeft: '60px', fontSize: '1.5rem', height: '64px', fontWeight: '800' }} 
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', paddingInline: '4px' }}>
                Payment will be first applied to dues, then to advance balance.
              </p>
            </div>

            {error && (
              <div style={{ 
                  padding: '12px 16px', borderRadius: '12px', 
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', 
                  fontSize: '0.85rem', display: 'flex', gap: '10px', alignItems: 'center' 
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} /> 
                <span style={{ fontWeight: '500' }}>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="ios-button ios-button-primary" 
              style={{ padding: '18px', fontSize: '1.1rem', borderRadius: '16px', boxShadow: '0 10px 20px -5px var(--primary)' }}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={22} />}
              {loading ? 'Processing Transaction...' : 'Complete Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
