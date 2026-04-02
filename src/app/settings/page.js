'use client';

import { useState, useEffect } from 'react';
import { 
  User, Shield, Moon, Sun, 
  LogOut, Plus, Trash2, Edit, Loader2, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import clsx from 'clsx';

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('Multi-Admin');
  
  // Auth state
  const [loadingLogout, setLoadingLogout] = useState(false);

  // Admins state
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  
  // Modals state
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [adminToEdit, setAdminToEdit] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [currentUser, setCurrentUser] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', email: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
    fetchAdminsAndUser();
  }, []);

  const fetchAdminsAndUser = async () => {
    setLoadingAdmins(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('admin_profiles').select('*').order('created_at', { ascending: false });
    
    if (!error && data) {
      setAdmins(data);
      if (user) {
        const myProfile = data.find(a => a.id === user.id);
        if (myProfile) {
          setCurrentUser(myProfile);
          setProfileForm({ name: myProfile.name, phone: myProfile.phone, email: myProfile.email });
        }
      }
    }
    setLoadingAdmins(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error("Logout failed:", err);
      setLoadingLogout(false);
    }
  };

  const executeDelete = async () => {
    if (!adminToDelete) return;
    setIsDeleting(true);
    try {
      // Calls our Postgres SECURITY DEFINER function to securely delete auth user
      const { error } = await supabase.rpc('delete_user', { user_id: adminToDelete.id });
      if (error) throw error;
      setAdmins(admins.filter(a => a.id !== adminToDelete.id));
      setAdminToDelete(null);
    } catch (err) {
      alert("Failed to delete admin: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const executeEdit = async (e) => {
    e.preventDefault();
    if (!adminToEdit) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('admin_profiles').update({
        name: adminToEdit.name,
        role: adminToEdit.role,
        phone: adminToEdit.phone
      }).eq('id', adminToEdit.id);
      
      if (error) throw error;
      
      setAdmins(admins.map(a => a.id === adminToEdit.id ? adminToEdit : a));
      setAdminToEdit(null);
      // Re-fetch in-case I just edited myself
      if(currentUser && currentUser.id === adminToEdit.id) fetchAdminsAndUser();
    } catch (err) {
      alert("Failed to save admin: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if(!currentUser) return;
    setIsUpdatingProfile(true);
    setProfileSuccess(false);
    try {
      const { error } = await supabase.from('admin_profiles')
        .update({ name: profileForm.name, phone: profileForm.phone })
        .eq('id', currentUser.id);
      
      if(error) throw error;
      setProfileSuccess(true);
      fetchAdminsAndUser(); // Refresh the list and current user
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const tabs = [
    { name: 'Display Options', icon: theme === 'dark' ? Moon : Sun },
    { name: 'Multi-Admin', icon: Shield },
    { name: 'Profile Settings', icon: User },
  ];

  return (
    <div className="settings-container animate-in">
      <header className="settings-header">
        <h1 className="text-gradient">Properties & System</h1>
        <p className="settings-subtext">Configuration suite for system administrators</p>
      </header>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {tabs.map((tab) => (
            <button 
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={clsx('sidebar-tab', activeTab === tab.name && 'active')}
            >
              <tab.icon size={20} />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          
          {activeTab === 'Display Options' && (
            <div className="ios-card glass animate-in display-settings-card">
              <div className="settings-card-header">
                <div className="settings-icon-wrapper">
                  {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
                </div>
                <div>
                  <h3>Appearance Preferences</h3>
                  <p>Customize how the system looks to you</p>
                </div>
              </div>

              <div className="settings-card-body">
                <div className="theme-toggle-row">
                  <div>
                    <h4>High Contrast Theme</h4>
                    <p>Toggle between Light and Dark mode globally.</p>
                  </div>
                  <div 
                    onClick={toggleTheme}
                    className="ios-switch"
                  >
                    <div className={clsx('ios-switch-knob', theme === 'dark' && 'active')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Multi-Admin' && (
            <div className="ios-card glass animate-in admin-settings-card">
              <header className="admin-card-header">
                <div>
                  <h3>Authorized Personnel</h3>
                  <p>Manage system access and privileges</p>
                </div>
                <button 
                  onClick={() => router.push('/admin_registration')}
                  className="ios-button ios-button-primary invite-btn">
                  <Plus size={18} /> Invite User
                </button>
              </header>
              
              {loadingAdmins ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                </div>
              ) : admins.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>
                  No administrators found in the database.
                </div>
              ) : (
                <div className="admin-list">
                  {admins.map((admin) => (
                    <div key={admin.id} className="admin-row">
                      <div className="admin-avatar">
                        {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="admin-info">
                        <p className="admin-name">{admin.name || 'Unnamed Admin'}</p>
                        <p className="admin-email">{admin.email}</p>
                      </div>
                      <div className="admin-badges">
                        <span className="role-badge">{admin.role || 'Admin'}</span>
                      </div>
                      <div className="admin-actions">
                        <button onClick={() => setAdminToEdit(admin)} className="action-btn edit" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => setAdminToDelete(admin)} className="action-btn delete" title="Revoke"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Profile Settings' && (
             <div className="ios-card glass animate-in profile-settings-card">
               <div className="settings-card-header">
                 <div className="settings-icon-wrapper">
                   <User size={24} />
                 </div>
                 <div>
                   <h3>Personal Profile</h3>
                   <p>Update your personal information and contact details</p>
                 </div>
               </div>

               <form onSubmit={handleUpdateProfile} className="profile-form">
                 <div className="field-group">
                   <label>Full Name</label>
                   <input type="text" className="ios-input" value={profileForm.name || ''} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required />
                 </div>
                 
                 <div className="field-group">
                   <label>Email Address</label>
                   <input type="email" className="ios-input" value={profileForm.email || ''} disabled />
                   <p className="field-subtext">Email address cannot be changed currently.</p>
                 </div>
 
                 <div className="field-group">
                   <label>Contact Phone</label>
                   <input type="text" className="ios-input" value={profileForm.phone || ''} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                 </div>
 
                 <button 
                  type="submit" 
                  className="ios-button ios-button-primary profile-save-btn" 
                  disabled={isUpdatingProfile}
                 >
                   {isUpdatingProfile ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                   <span>{isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                 </button>
 
                 {profileSuccess && (
                   <p className="success-message animate-in">
                     <CheckCircle size={16} /> Profile updated successfully!
                   </p>
                 )}
               </form>
             </div>
          )}

        </div>
      </div>

      <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button 
          onClick={handleLogout}
          disabled={loadingLogout}
          className="ios-button"
          style={{ 
            width: '100%',
            maxWidth: '400px',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '20px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontSize: '1.05rem',
            fontWeight: '600',
            boxShadow: '0 8px 16px -4px rgba(239, 68, 68, 0.2)'
          }}
        >
          {loadingLogout ? <Loader2 size={24} className="animate-spin" style={{ marginRight: '12px' }} /> : <LogOut size={24} style={{ marginRight: '12px' }} />}
          {loadingLogout ? 'Securing Session...' : 'Sign Out of Admin Console'}
        </button>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', textAlign: 'center', marginTop: '16px' }}>
          You will need to re-authenticate to access the dashboard.
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {adminToDelete && (
        <div className="modal-overlay animate-in">
          <div className="modal-content glass" style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--danger)' }}>Revoke Access</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Permanent Action</p>
                </div>
              </div>
            </div>
            <div className="modal-body" style={{ padding: '24px 32px' }}>
              <p>Are you sure you want to delete the administrator <b>{adminToDelete.name}</b>?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginTop: '8px' }}>
                This user ({adminToDelete.email}) will instantly lose access to the portal properties and system components.
              </p>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '0' }}>
              <button 
                className="ios-button" 
                style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                onClick={() => setAdminToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="ios-button" 
                style={{ background: 'var(--danger)', color: 'white', boxShadow: '0 4px 12px -4px var(--danger)' }}
                onClick={executeDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {isDeleting ? 'Revoking...' : 'Yes, Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {adminToEdit && (
        <div className="modal-overlay animate-in">
          <div className="modal-content glass">
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Edit Administrator</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>{adminToEdit.email}</p>
              </div>
            </div>
            <form onSubmit={executeEdit}>
              <div className="modal-body">
                <div className="field-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="ios-input" 
                    value={adminToEdit.name || ''} 
                    onChange={e => setAdminToEdit({...adminToEdit, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="field-group" style={{ marginTop: '16px' }}>
                  <label>Contact Phone</label>
                  <input 
                    type="text" 
                    className="ios-input" 
                    value={adminToEdit.phone || ''} 
                    onChange={e => setAdminToEdit({...adminToEdit, phone: e.target.value})} 
                  />
                </div>
                <div className="field-group" style={{ marginTop: '16px' }}>
                  <label>Access Role</label>
                  <select 
                    className="ios-input" 
                    value={adminToEdit.role || 'Staff Admin'} 
                    onChange={e => setAdminToEdit({...adminToEdit, role: e.target.value})}
                    style={{ appearance: 'none', background: 'var(--background)' }}
                  >
                    <option value="Super Admin">Super Admin (All Privileges)</option>
                    <option value="Staff Admin">Staff Admin</option>
                    <option value="Accountant">Accountant/Finance</option>
                    <option value="Viewer">Read-Only Viewer</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="ios-button" 
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                  onClick={() => setAdminToEdit(null)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="ios-button ios-button-primary" 
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
