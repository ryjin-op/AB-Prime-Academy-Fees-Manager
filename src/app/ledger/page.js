'use client';

import { useState, useEffect, Suspense } from 'react';
import { 
  FileText, Search, Filter, ArrowUpRight, History, 
  Clock, Loader2, AlertCircle, Trash2, Edit, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LedgerDeleteModal from '@/components/LedgerDeleteModal';
import LedgerEditModal from '@/components/LedgerEditModal';
import { useSearchParams, useRouter } from 'next/navigation';

function LedgerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState(searchParams.get('filter') || 'All');
  const [loading, setLoading] = useState(true);
  const [txToDelete, setTxToDelete] = useState(null);
  const [txToEdit, setTxToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState({
    transactions: [],
    stats: {
      totalCount: 0,
      totalCollection: 0,
      deletedLogs: 0
    }
  });

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      // 1. Fetch Payments with student names
      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          payment_type,
          students ( name, class )
        `)
        .order('payment_date', { ascending: false });

      if (payError) throw payError;

      // 2. Fetch Audit Logs (Deletions, Registrations, Payments)
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (auditError) throw auditError;

      // Transform data for the UI
      const formattedPayments = (payments || []).map(p => ({
        id: p.id,
        name: p.students?.name || 'Student (Removed)',
        studentClass: p.students?.class || '',
        type: p.payment_type.replace(/_/g, ' '),
        amount: parseFloat(p.amount),
        rawDate: new Date(p.payment_date),
        date: new Date(p.payment_date).toLocaleDateString(),
        status: 'Completed',
        admin: 'Admin',
        source: 'payment',
        student_id: p.students?.id // Store for balance reversal logic
      }));

      const formattedLogs = (auditLogs || []).map(log => {
        if (log.activity === 'STUDENT_DELETED') {
          return {
            id: log.id,
            name: log.details?.name || 'Removed Student',
            studentClass: log.details?.class || '',
            type: 'RECORD REMOVAL',
            amount: 0,
            rawDate: new Date(log.created_at),
            date: new Date(log.created_at).toLocaleDateString(),
            status: 'Deleted',
            admin: 'Admin',
            source: 'log'
          };
        }
        if (log.activity === 'STUDENT_REGISTERED') {
          return {
            id: log.id,
            name: log.details?.name || 'New Student',
            studentClass: log.details?.class || '',
            type: 'ENROLLMENT',
            amount: 0,
            rawDate: new Date(log.created_at),
            date: new Date(log.created_at).toLocaleDateString(),
            status: 'Registered',
            admin: 'Admin',
            source: 'log'
          };
        }
        return null; 
      }).filter(Boolean);

      const allTransactions = [...formattedPayments, ...formattedLogs]
        .sort((a, b) => b.rawDate - a.rawDate);

      const totalCollection = formattedPayments.reduce((acc, p) => acc + p.amount, 0);
      const deletedCount = formattedLogs.filter(l => l.status === 'Deleted').length;

      setLedgerData({
        transactions: allTransactions,
        stats: {
          totalCount: formattedPayments.length,
          totalCollection: totalCollection,
          deletedLogs: deletedCount
        }
      });
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrigger = (tx) => {
    setTxToDelete(tx);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (tx) => {
    setActionLoading(true);
    try {
      const table = tx.source === 'payment' ? 'payments' : 'audit_logs';
      const { error } = await supabase.from(table).delete().eq('id', tx.id);
      
      if (error) throw error;
      
      // Log the deletion itself
      await supabase.from('audit_logs').insert({
        activity: 'LEDGER_ENTRY_DELETED',
        details: { tx_id: tx.id, name: tx.name, source: tx.source }
      });

      setIsDeleteModalOpen(false);
      await fetchLedger();
    } catch (err) {
      console.error('Delete Error:', err);
      alert(err.message || 'Failed to delete entry');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (tx) => {
    setTxToEdit(tx);
    setIsEditModalOpen(true);
  };

  const filteredTransactions = ledgerData.transactions.filter(t => {
    // 1. Text Search
    const searchLower = search.toLowerCase();
    const matchSearch = (t.name?.toLowerCase().includes(searchLower) || false) ||
                        (t.admin?.toLowerCase().includes(searchLower) || false) ||
                        (t.studentClass?.toLowerCase().includes(searchLower) || false);
    if (!matchSearch) return false;

    // 2. Dropdown Filter
    if (filterType === 'All') return true;

    const today = new Date();
    
    if (filterType === 'this_month') {
       return t.rawDate.getMonth() === today.getMonth() && t.rawDate.getFullYear() === today.getFullYear();
    }
    
    if (filterType === 'previous_month') {
       const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
       return t.rawDate.getMonth() === prevMonthDate.getMonth() && t.rawDate.getFullYear() === prevMonthDate.getFullYear();
    }
    
    // Exact Class check
    return t.studentClass?.toLowerCase() === filterType.toLowerCase();
  });
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient">Financial Ledger 🧾</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Audit history of all payments and system logs</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="ios-button" style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
            <FileText size={18} /> Export CSV
          </button>
        </div>
      </header>

      {/* Audit Stats */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '32px' }}>
        <div className="ios-card glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
            <History size={16} /> TOTAL TRANSACTIONS
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: '700' }}>{ledgerData.stats.totalCount}</p>
        </div>
        <div className="ios-card glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
            <ArrowUpRight size={16} color="var(--success)" /> TOTAL COLLECTION
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: '700' }}>₹ {ledgerData.stats.totalCollection.toLocaleString()}</p>
        </div>
        <div className="ios-card glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
            <AlertCircle size={16} color="var(--danger)" /> DELETED LOGS
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: '700' }}>{ledgerData.stats.deletedLogs}</p>
        </div>
      </div>

      <div className="ios-card glass" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              className="ios-input" 
              style={{ paddingLeft: '48px', borderRadius: '16px' }} 
              placeholder="Filter by name, admin, or date..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <select 
              className="ios-input" 
              style={{ 
                appearance: 'none', background: 'var(--secondary)', color: 'var(--secondary-foreground)', 
                fontWeight: '600', paddingRight: '40px', borderRadius: '16px', height: '52px', border: 'none',
                cursor: 'pointer'
              }}
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                // Update URL quietly, no reload
                const currentUrl = new URL(window.location.href);
                if (e.target.value === 'All') currentUrl.searchParams.delete('filter');
                else currentUrl.searchParams.set('filter', e.target.value);
                router.push(currentUrl.pathname + currentUrl.search, { scroll: false });
              }}
            >
              <option value="All">All Records</option>
              <option value="this_month">This Month</option>
              <option value="previous_month">Previous Month</option>
              <option disabled>──────────────</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
              <option value="B.com">B.com</option>
              <option value="M.com">M.com</option>
              <option value="M.B.A">M.B.A</option>
            </select>
            {filterType !== 'All' ? (
              <X size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--secondary-foreground)' }} />
            ) : (
              <Filter size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--secondary-foreground)' }} />
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
                <th style={{ padding: '16px 24px' }}>Transaction</th>
                <th style={{ padding: '16px' }}>Date</th>
                <th style={{ padding: '16px' }}>Amount</th>
                <th style={{ padding: '16px' }}>Modified By</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.9rem' }}>
              {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                <tr key={t.id} style={{ 
                  borderTop: '1px solid var(--border)',
                  background: t.status === 'Deleted' ? 'rgba(239, 68, 68, 0.05)' : 'none'
                }}>
                  <td style={{ padding: '16px 24px' }}>
                    <p style={{ fontWeight: '600' }}>{t.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>{t.type}</p>
                  </td>
                  <td style={{ padding: '16px' }}>{t.date}</td>
                  <td style={{ padding: '16px', fontWeight: '700', color: t.amount > 0 ? 'var(--success)' : (t.amount < 0 ? 'var(--danger)' : 'inherit') }}>
                    {t.amount > 0 ? `+ ₹${t.amount}` : (t.amount < 0 ? `- ₹${Math.abs(t.amount)}` : '₹0')}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '24px', height: '24px', borderRadius: '50%', background: 'var(--muted)', 
                        fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' 
                      }}>
                        {t.admin.charAt(0)}
                      </div>
                      {t.admin}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', 
                      borderRadius: '20px', 
                      background: t.status === 'Deleted' ? 'rgba(239, 68, 68, 0.1)' : 
                                 t.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 
                                 t.status === 'Registered' ? 'rgba(79, 70, 229, 0.1)' : 'var(--secondary)',
                      color: t.status === 'Deleted' ? 'var(--danger)' : 
                             t.status === 'Completed' ? 'var(--success)' : 
                             t.status === 'Registered' ? 'var(--primary)' : 'var(--secondary-foreground)',
                      textTransform: 'uppercase'
                    }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', opacity: actionLoading ? 0.5 : 1 }}>
                      <button 
                        onClick={() => handleEdit(t)}
                        title="Edit Note" 
                        style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                        disabled={actionLoading}
                      >
                        <Edit size={16} />
                      </button>
                      {t.status !== 'Deleted' && (
                        <button 
                          onClick={() => handleDeleteTrigger(t)}
                          title="Delete Record" 
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                          disabled={actionLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LedgerDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        tx={txToDelete || {}}
        loading={actionLoading}
      />

      <LedgerEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateSuccess={fetchLedger}
        tx={txToEdit || {}}
      />
    </div>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    }>
      <LedgerContent />
    </Suspense>
  );
}
