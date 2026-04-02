import { useState } from 'react';
import { Users, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import PaymentModal from './PaymentModal';

export default function StudentCard({ student: initialStudent }) {
  const [student, setStudent] = useState(initialStudent);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { 
    id, name, photo_url, class: className, semester, 
    guardian_phone, total_due, advance_balance 
  } = student;

  const handlePaymentSuccess = (updatedStudent) => {
    setStudent(updatedStudent);
  };

  return (
    <div className="ios-card glass animate-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {photo_url ? (
          <img 
            src={photo_url} 
            alt={name} 
            style={{ width: '60px', height: '60px', borderRadius: '18px', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ 
            width: '60px', height: '60px', borderRadius: '18px', 
            background: 'var(--secondary)', color: 'var(--primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Users size={24} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{name}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>
            {className} / {semester}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--muted-foreground)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>STUDENT</p>
              <p style={{ color: 'var(--foreground)' }}>{student.phone}</p>
            </div>
            <div style={{ color: 'var(--muted-foreground)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>GUARDIAN</p>
              <p style={{ color: 'var(--foreground)' }}>{student.guardian_phone}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', 
        marginTop: '20px', padding: '12px', borderRadius: '16px', 
        background: 'var(--muted)', border: '1px solid var(--border)' 
      }}>
        <div>
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: 'bold', letterSpacing: '0.05em' }}>Current Due</p>
          <p style={{ fontWeight: '700', color: total_due > 0 ? 'var(--danger)' : 'inherit' }}>₹{total_due}</p>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: 'bold', letterSpacing: '0.05em' }}>Advance</p>
          <p style={{ fontWeight: '700', color: advance_balance > 0 ? 'var(--success)' : 'inherit' }}>₹{advance_balance}</p>
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="ios-button ios-button-primary" 
          style={{ flex: 1, padding: '10px 14px', fontSize: '0.9rem' }}
        >
          <CheckCircle2 size={18} />
          Made Payment
        </button>
        <Link 
          href={`/students/${id}`} 
          className="ios-button" 
          style={{ width: '42px', padding: '0', background: 'var(--muted)', color: 'var(--foreground)' }}
        >
          <ArrowRight size={18} />
        </Link>
      </div>

      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        student={student} 
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
