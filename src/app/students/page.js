'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, Filter, Plus, LayoutGrid, List as ListIcon, Loader2, AlertCircle, Users, X } from 'lucide-react';
import StudentCard from '@/components/StudentCard';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';

function StudentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState(searchParams.get('filter') || 'All');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    // 1. Text Search
    const matchSearch = (s.name?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (s.class?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (s.guardian_phone?.includes(search) || false);
    if (!matchSearch) return false;

    // 2. Dropdown Filter
    if (filterType === 'All') return true;
    if (filterType === 'due') return (s.total_due || 0) > 0;
    if (filterType === 'due_current_month') return (s.total_due || 0) > 0 && (s.total_due || 0) <= (s.monthly_fee || 0);
    if (filterType === 'advanced') return (s.advance_balance || 0) > 0;

    // Exact Class check
    return s.class?.toLowerCase() === filterType.toLowerCase();
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ios-card glass" style={{ textAlign: 'center', padding: '40px' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
        <h2>Error Loading Students</h2>
        <p>{error}</p>
        <button onClick={fetchStudents} className="ios-button" style={{ marginTop: '20px' }}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient">Student Directory 👨‍🎓</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Total {students.length} students enrolled</p>
        </div>
      </header>

      {/* Top Search & Filter Section */}
      <div className="ios-card glass search-filter-card" style={{ marginBottom: '32px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={18}
            strokeWidth={2.5}
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}
          />
          <input
            type="text"
            placeholder="Search name, phone, or class..."
            className="ios-input"
            style={{ paddingLeft: '48px', borderRadius: '16px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative' }}>
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
            <option value="All">All Students</option>
            <option value="due">Due Available (Global)</option>
            <option value="due_current_month">Due Current Month</option>
            <option value="advanced">Advanced Credits</option>
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

      {/* Student List Section */}
      <div className="grid-students">
        {filteredStudents.length > 0 ? (
          filteredStudents.map(student => (
            <StudentCard key={student.id} student={student} />
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: 'var(--muted-foreground)' }}>
            <Users size={64} strokeWidth={1} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3>No results found</h3>
            <p>Try searching for a different name or class</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    }>
      <StudentsContent />
    </Suspense>
  );
}
