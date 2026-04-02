'use client';

import { use, useState, useEffect } from 'react';
import { 
  User, Phone, MapPin, Calendar, BookOpen, 
  DollarSign, CreditCard, Clock, Edit3, Trash2, 
  ArrowLeft, CheckCircle2, AlertCircle, Info, ChevronRight, MessageSquare, Printer, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import PaymentModal from '@/components/PaymentModal';
import StudentEditModal from '@/components/StudentEditModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useRouter } from 'next/navigation';

export default function StudentProfile({ params }) {
  const resolvedParams = use(params);
  const studentId = resolvedParams?.id;

  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    setMounted(true);
    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setStudent(data);

      // Fetch payment timeline
      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      if (payError) throw payError;
      setTimeline(payments || []);
    } catch (err) {
      console.error('Error fetching student:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (updatedStudent) => {
    setStudent(updatedStudent);
    fetchStudent(); // Refresh timeline
  };

  const handleUpdateSuccess = (updatedStudent) => {
    setStudent(updatedStudent);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      
      // 1. Record deletion in audit logs BEFORE deleting the student (to capture their data)
      await supabase.from('audit_logs').insert({
        activity: 'STUDENT_DELETED',
        details: { 
          id: student.id, 
          name: student.name,
          deleted_at: new Date().toISOString()
        }
      });

      // 2. Perform the deletion
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;
      
      setIsDeleteModalOpen(false);
      router.push('/students');
      router.refresh();
    } catch (err) {
      console.error('Delete Error:', err);
      alert(err.message || 'Failed to delete student.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="ios-card glass" style={{ textAlign: 'center', padding: '40px' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
        <h2>Student Not Found</h2>
        <Link href="/students" className="ios-button" style={{ marginTop: '20px' }}>Back to Directory</Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (student.total_due > 0) return 'var(--danger)';
    if (student.advance_balance > 0) return 'var(--primary)';
    return 'var(--success)';
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/students" className="ios-button" style={{ 
            width: '44px', height: '44px', padding: '0', 
            background: 'var(--muted)', borderRadius: '14px' 
          }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.75rem' }}>{student.name}</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Student Profile & Financials</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="ios-button" 
            style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}
            disabled={deleting}
          >
            <Edit3 size={18} /> Edit
          </button>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="ios-button" 
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}
            disabled={deleting}
          >
            {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />} 
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </header>

      <div className="grid-main">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="ios-card glass">
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ 
                width: '100px', height: '100px', borderRadius: '32px', 
                background: 'var(--secondary)', color: 'var(--primary)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '2.5rem', fontWeight: 'bold' 
              }}>
                {student?.name?.charAt(0) || '?'}
              </div>
              <div>
                <span style={{ 
                   background: student.status === 'active' ? 'var(--success)' : 'var(--muted)', 
                   color: 'white', fontSize: '0.7rem', 
                   padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', 
                   textTransform: 'uppercase', marginBottom: '8px', display: 'inline-block' 
                }}>
                  {student.status}
                </span>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{student.name}</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                   Admission: {mounted ? new Date(student.admission_date || Date.now()).toLocaleDateString() : '...'}
                </p>
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' 
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Class / Semester</p>
                <p style={{ fontWeight: '600' }}>{student.class || '-'} / {student.semester || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Father's Name</p>
                <p style={{ fontWeight: '600' }}>{student.father_name || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Mother's Name</p>
                <p style={{ fontWeight: '600' }}>{student.mother_name || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Date of Birth</p>
                <p style={{ fontWeight: '600' }}>{mounted && student.dob ? new Date(student.dob).toLocaleDateString() : (mounted ? '-' : '...')}</p>
              </div>
              <div>
                 <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Student Contact</p>
                 <div style={{ display: 'flex', gap: '8px' }}>
                    <p style={{ fontWeight: '600' }}>{student.phone}</p>
                    {student.whatsapp && (
                      <Link href={`https://wa.me/${(student.whatsapp || '').replace(/\D/g, '')}`} target="_blank" style={{ color: 'var(--success)' }}>
                        <MessageSquare size={16} />
                      </Link>
                    )}
                 </div>
              </div>
              <div>
                 <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Guardian Contact</p>
                 <p style={{ fontWeight: '600' }}>{student.guardian_phone}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Monthly Fees</p>
                <p style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1.1rem' }}>₹{student.monthly_fee}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Address</p>
                <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{student.address}</p>
              </div>
            </div>
          </div>

          <div className="ios-card glass">
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="var(--primary)" />
                Recent Payments
              </h3>
            </header>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {timeline.length > 0 ? timeline.map((item, index) => (
                <div 
                  key={item.id} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
                    borderBottom: index === timeline.length - 1 ? 'none' : '1px solid var(--border)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '700' }}>{item.payment_type.replace('_', ' ').toUpperCase()}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{new Date(item.payment_date).toLocaleDateString()}</p>
                  </div>
                  <div style={{ fontWeight: '800', color: 'var(--success)' }}>
                    ₹{item.amount}
                  </div>
                </div>
              )) : (
                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '20px' }}>No payment history recorded.</p>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="ios-card glass" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white' }}>
            <p style={{ opacity: 0.8, fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>TOTAL OUTSTANDING</p>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>₹{student.total_due}</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', opacity: 0.9 }}>
              <span>Advance Balance: ₹{student.advance_balance}</span>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="ios-button" 
              style={{ width: '100%', marginTop: '20px', background: 'white', color: 'var(--primary)', fontWeight: '700' }}
            >
              <CreditCard size={18} />
              Made Payment
            </button>
          </div>

          <div className="ios-card glass">
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--primary)" />
              Fee Management
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: '1.5', marginBottom: '16px' }}>
              Auto-billing occurs on the 1st of every month. Payments are first applied to existing dues, then to advance balance.
            </p>
            <button className="ios-button" style={{ width: '100%', padding: '12px', background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
              <Printer size={18} />
              Print Full Statement
            </button>
          </div>

        </div>
      </div>

      <PaymentModal 
        student={student}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
      <StudentEditModal
        student={student}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateSuccess={handleUpdateSuccess}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        studentName={student.name}
        loading={deleting}
      />
    </div>
  );
}
