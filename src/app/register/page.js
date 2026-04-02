'use client';

import { useState } from 'react';
import { 
  User, Phone, MapPin, Calendar, BookOpen, 
  DollarSign, ArrowLeft, Save, Loader2, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterStudent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sameAsPhone, setSameAsPhone] = useState(false);

  const [formData, setFormData] = useState({
    name: '', father_name: '', mother_name: '', dob: '', address: '',
    phone: '', whatsapp: '', guardian_phone: '',
    class: '', semester: '', admission_date: new Date().toISOString().split('T')[0],
    monthly_fee: '', admission_fee: '', initial_advance: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'phone' && sameAsPhone) next.whatsapp = value;
      return next;
    });
  };

  const handleCheckboxChange = () => {
    setSameAsPhone(!sameAsPhone);
    if (!sameAsPhone) {
      setFormData(prev => ({ ...prev, whatsapp: prev.phone }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const monthlyFeeNum = parseFloat(formData.monthly_fee) || 0;
      const initialAdvanceNum = parseFloat(formData.initial_advance) || 0;
      const admissionFeeNum = parseFloat(formData.admission_fee) || 0;

      let totalDue = admissionFeeNum; 
      let advanceBalance = initialAdvanceNum;

      if (advanceBalance >= totalDue) {
          advanceBalance = advanceBalance - totalDue;
          totalDue = 0;
      } else {
          totalDue = totalDue - advanceBalance;
          advanceBalance = 0;
      }

      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert({
          name: formData.name, father_name: formData.father_name,
          mother_name: formData.mother_name, dob: formData.dob || null,
          address: formData.address, phone: formData.phone,
          whatsapp: formData.whatsapp, guardian_phone: formData.guardian_phone,
          class: formData.class, semester: formData.semester,
          admission_date: formData.admission_date, monthly_fee: monthlyFeeNum,
          total_due: totalDue, advance_balance: advanceBalance, status: 'active'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. If there was an initial payment, record it in the payments table
      if (initialAdvanceNum > 0) {
        await supabase.from('payments').insert({
          student_id: newStudent.id,
          amount: initialAdvanceNum,
          payment_type: 'initial_advance',
          month_for: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          payment_date: new Date().toISOString()
        });
      }

      // 3. Log the registration event
      await supabase.from('audit_logs').insert({
        activity: 'STUDENT_REGISTERED',
        details: { id: newStudent.id, name: newStudent.name }
      });
      router.push('/students');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/dashboard" className="ios-button glass" style={{ width: '44px', height: '44px', padding: '0' }}><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-gradient">Register Student ✨</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Fill details for new enrollment</p>
        </div>
      </header>

      {error && (
        <div className="ios-card" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', marginBottom: '24px' }}>
          <AlertCircle size={20} /> <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
        <div className="ios-card glass">
          <h3><User size={20} className="inline mr-2" /> Personal Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <input name="name" className="ios-input" placeholder="Name *" required value={formData.name} onChange={handleChange} />
            <input name="father_name" className="ios-input" placeholder="Father's Name" value={formData.father_name} onChange={handleChange} />
            <input name="mother_name" className="ios-input" placeholder="Mother's Name" value={formData.mother_name} onChange={handleChange} />
            <input type="date" name="dob" className="ios-input" value={formData.dob} onChange={handleChange} />
            <textarea name="address" className="ios-input" placeholder="Address" style={{ gridColumn: '1 / -1', minHeight: '80px' }} value={formData.address} onChange={handleChange} />
          </div>
        </div>

        <div className="ios-card glass">
          <h3><Phone size={20} className="inline mr-2" /> Contact Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <input name="phone" className="ios-input" placeholder="Student Phone *" required value={formData.phone} onChange={handleChange} />
            <input name="whatsapp" className="ios-input" placeholder="Student WhatsApp" disabled={sameAsPhone} value={formData.whatsapp} onChange={handleChange} />
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="same-as-phone" checked={sameAsPhone} onChange={handleCheckboxChange} />
              <label htmlFor="same-as-phone">WhatsApp same as student phone</label>
            </div>
            <input name="guardian_phone" className="ios-input" placeholder="Guardian Number *" required value={formData.guardian_phone} onChange={handleChange} />
          </div>
        </div>

        <div className="ios-card glass">
          <h3><BookOpen size={20} className="inline mr-2" /> Academic & Fees</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <input name="class" className="ios-input" placeholder="Class" value={formData.class} onChange={handleChange} />
            <input name="semester" className="ios-input" placeholder="Batch" value={formData.semester} onChange={handleChange} />
            <input type="date" name="admission_date" className="ios-input" value={formData.admission_date} onChange={handleChange} />
            <input type="number" name="monthly_fee" className="ios-input" placeholder="Monthly Fee *" required value={formData.monthly_fee} onChange={handleChange} />
            <input type="number" name="admission_fee" className="ios-input" placeholder="Admission Fee" value={formData.admission_fee} onChange={handleChange} />
            <input type="number" name="initial_advance" className="ios-input" placeholder="Initial Advance" value={formData.initial_advance} onChange={handleChange} />
          </div>
        </div>

        <button type="submit" className="ios-button ios-button-primary w-full py-4 text-lg" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Save size={22} />} <span>Register Student</span>
        </button>
      </form>
    </div>
  );
}
