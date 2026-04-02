'use client';

import { useState } from 'react';
import { User, Mail, Lock, Phone, ShieldCheck, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Staff Admin'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up user in Supabase Auth
      // The trigger 'on_auth_user_created' will handle inserting into 'admin_profiles'
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
            role: formData.role
          }
        }
      });

      if (authError) throw authError;

      if (authData?.user) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="ios-card glass animate-in" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--success)', 
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
          }}>
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-gradient">Registration Successful!</h2>
          <p style={{ marginTop: '16px', color: 'var(--muted-foreground)' }}>
            Admin account created for <b>{formData.email}</b>.<br/>
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="ios-card glass animate-in" style={{ width: '100%', maxWidth: '450px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '20px', 
            background: 'var(--primary)', color: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 20px', boxShadow: '0 10px 20px -5px var(--primary)' 
          }}>
            <User size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Create Admin Account</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
            Setup credentials for AB Prime Academy
          </p>
        </div>

        {error && (
          <div style={{ 
            marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: '12px', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' 
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block opacity-70">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input name="name" className="ios-input" style={{ paddingLeft: '48px' }} placeholder="Admin Name" value={formData.name} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block opacity-70">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input type="email" name="email" className="ios-input" style={{ paddingLeft: '48px' }} placeholder="admin@example.com" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block opacity-70">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input type="password" name="password" className="ios-input" style={{ paddingLeft: '48px' }} placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength="6" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block opacity-70">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input name="phone" className="ios-input" style={{ paddingLeft: '48px' }} placeholder="+91 0000000000" value={formData.phone} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="ios-button ios-button-primary" style={{ padding: '16px', marginTop: '12px' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <>Register Admin <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
