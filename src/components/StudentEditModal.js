'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User, Phone, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function StudentEditModal({ student, isOpen, onClose, onUpdateSuccess }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', father_name: '', mother_name: '', dob: '', address: '',
    phone: '', whatsapp: '', guardian_phone: '',
    class: '', semester: '', monthly_fee: '', status: ''
  });

  useEffect(() => {
    setMounted(true);
    if (student) {
      setFormData({
        name: student.name || '',
        father_name: student.father_name || '',
        mother_name: student.mother_name || '',
        dob: student.dob || '',
        address: student.address || '',
        phone: student.phone || '',
        whatsapp: student.whatsapp || '',
        guardian_phone: student.guardian_phone || '',
        class: student.class || '',
        semester: student.semester || '',
        monthly_fee: student.monthly_fee || '',
        status: student.status || 'active'
      });
    }
  }, [student]);

  if (!isOpen || !mounted || !student) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('students')
        .update({
          ...formData,
          monthly_fee: parseFloat(formData.monthly_fee) || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      onUpdateSuccess(data);
      onClose();
    } catch (err) {
      console.error('Update Error:', err);
      setError(err.message || 'Failed to update student profile.');
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Edit Student Profile</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Updating record for {student.name}</p>
          </div>
          <button onClick={onClose} style={{ 
            background: 'var(--muted)', border: 'none', color: 'var(--muted-foreground)', 
            cursor: 'pointer', width: '32px', height: '32px', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', borderRadius: '50%' 
          }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '60vh' }}>
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="field-group">
                <label className="field-label">Student Name</label>
                <input name="name" className="ios-input" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="field-group">
                <label className="field-label">Account Status</label>
                <select name="status" className="ios-input" value={formData.status} onChange={handleChange} style={{ height: '48px' }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase' }}>Parental Information</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="field-group">
                  <label className="field-label">Father's Name</label>
                  <input name="father_name" className="ios-input" value={formData.father_name} onChange={handleChange} />
                </div>
                <div className="field-group">
                  <label className="field-label">Mother's Name</label>
                  <input name="mother_name" className="ios-input" value={formData.mother_name} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase' }}>Academic & Contact</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="field-group">
                  <label className="field-label">Class</label>
                  <input name="class" className="ios-input" value={formData.class} onChange={handleChange} />
                </div>
                <div className="field-group">
                  <label className="field-label">Semester / Batch</label>
                  <input name="semester" className="ios-input" value={formData.semester} onChange={handleChange} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="field-group">
                  <label className="field-label">Student Phone</label>
                  <input name="phone" className="ios-input" value={formData.phone} onChange={handleChange} required />
                </div>
                <div className="field-group">
                  <label className="field-label">Guardian Phone</label>
                  <input name="guardian_phone" className="ios-input" value={formData.guardian_phone} onChange={handleChange} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="field-group">
                  <label className="field-label">WhatsApp Num</label>
                  <input name="whatsapp" className="ios-input" value={formData.whatsapp} onChange={handleChange} />
                </div>
                <div className="field-group">
                  <label className="field-label">Monthly Fees (₹)</label>
                  <input type="number" name="monthly_fee" className="ios-input" value={formData.monthly_fee} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Residential Address</label>
              <textarea name="address" className="ios-input" value={formData.address} onChange={handleChange} style={{ minHeight: '80px', paddingTop: '12px' }} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="ios-button" style={{ flex: 1, background: 'var(--muted)', color: 'var(--foreground)' }}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="ios-button ios-button-primary" 
              style={{ flex: 2, padding: '16px', boxShadow: '0 8px 16px -4px var(--primary)' }}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              {loading ? 'Saving Updates...' : 'Apply Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
