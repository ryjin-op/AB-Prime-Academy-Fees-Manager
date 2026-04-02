'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, TrendingDown, Users, CreditCard, 
  Clock, DollarSign, Calendar, AlertCircle, Loader2
} from 'lucide-react';
import DashboardCard from '@/components/DashboardCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalReceived: 0,
    accruedFees: 0,
    outstandingCount: 0,
    activeStudents: 0,
    lifetimeAccrued: 0,
    advanceBalance: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students Stats
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('total_due, advance_balance, status, monthly_fee');

      if (studentError) throw studentError;

      const active = students.filter(s => s.status === 'active');
      const outstanding = students.filter(s => s.total_due > 0).length;
      const totalDue = students.reduce((acc, s) => acc + (parseFloat(s.total_due) || 0), 0);
      const totalAdvance = students.reduce((acc, s) => acc + (parseFloat(s.advance_balance) || 0), 0);
      
      const firstOfCurrentMonth = new Date();
      firstOfCurrentMonth.setDate(1);
      firstOfCurrentMonth.setHours(0, 0, 0, 0);

      // Fees are accrued ONLY for students who joined BEFORE the current month
      // New joiners start contributing to accrued fees from the 1st of next month
      const monthlyAccrued = active
        .filter(s => s.admission_date && new Date(s.admission_date) < firstOfCurrentMonth)
        .reduce((acc, s) => acc + (parseFloat(s.monthly_fee) || 0), 0);

      // 2. Fetch Payments for metrics
      const { data: paymentsData, error: payError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          payment_type,
          students (
            name
          )
        `)
        .order('payment_date', { ascending: false });

      if (payError) throw payError;

      // Flatten the structure for easier use in the UI
      const payments = (paymentsData || []).map(p => ({
        ...p,
        student_name: p.students?.name || 'Anonymous'
      }));

      const currentMonth = new Date().getMonth();
      const currentMonthReceived = payments
        .filter(p => p.payment_date && new Date(p.payment_date).getMonth() === currentMonth)
        .reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

      setStats({
        totalReceived: currentMonthReceived,
        accruedFees: monthlyAccrued,
        outstandingCount: outstanding,
        activeStudents: active.length,
        lifetimeAccrued: totalDue,
        advanceBalance: totalAdvance
      });

      setRecentPayments(payments.slice(0, 5));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Set some default state to avoid infinite loading if error occurs
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  // Placeholder data for chart (can be refined to be dynamic based on monthly aggregates)
  const chartData = [
    { name: 'Jan', collection: stats.totalReceived * 0.8, dues: stats.lifetimeAccrued * 0.2 },
    { name: 'Feb', collection: stats.totalReceived * 0.9, dues: stats.lifetimeAccrued * 0.1 },
    { name: 'Mar', collection: stats.totalReceived, dues: stats.lifetimeAccrued },
  ];

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px' }}>
        <h1 className="text-gradient">Welcome, Admin 📊</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Financial Overview for Current Month</p>
      </header>

      <section className="grid-stats">
        <DashboardCard 
          title="Total Received This Month" 
          value={`₹ ${stats.totalReceived.toLocaleString()}`} 
          subtext="Net collection" 
          icon={TrendingUp} 
          onClick={() => router.push('/ledger?filter=this_month')}
        />
        <DashboardCard 
          title="Accrued Fees This Month" 
          value={`₹ ${stats.accruedFees.toLocaleString()}`} 
          subtext="Expected for all students" 
          icon={Calendar} 
          onClick={() => router.push('/students?filter=due_current_month')}
        />

        <DashboardCard 
          title="Active Students" 
          value={stats.activeStudents.toString()} 
          subtext="Currently enrolled" 
          icon={Users} 
          onClick={() => router.push('/students?filter=All')}
        />
        <DashboardCard 
          title="Outstanding (Global)" 
          value={`₹ ${stats.lifetimeAccrued.toLocaleString()}`} 
          subtext="Total due across institute" 
          icon={Clock} 
          onClick={() => router.push('/students?filter=due')}
        />
        <DashboardCard 
          title="Advance Credits" 
          value={`₹ ${stats.advanceBalance.toLocaleString()}`} 
          subtext="Total student balances" 
          icon={CreditCard} 
          onClick={() => router.push('/students?filter=advanced')}
        />
      </section>

      <div className="grid-main">
        <div className="ios-card glass" style={{ minHeight: '400px' }}>
          <header style={{ marginBottom: '24px' }}>
            <h2>Revenue Analysis 📈</h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Monthly Performance</p>
          </header>
          <div style={{ width: '100%', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)' }} 
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                />
                <Bar dataKey="collection" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Received" />
                <Bar dataKey="dues" fill="var(--danger)" radius={[4, 4, 0, 0]} name="Dues" opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ios-card glass">
          <header style={{ marginBottom: '24px' }}>
            <h3>Recent Transactions 🧾</h3>
          </header>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentPayments.length > 0 ? recentPayments.map((payment, i) => (
              <div 
                key={payment.id || i} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                  borderRadius: '16px', background: 'var(--muted)', border: '1px solid var(--border)' 
                }}
              >
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', 
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
                }}>
                  {payment.student_name?.charAt(0) || 'P'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{payment.student_name || 'Student'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{new Date(payment.payment_date).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'var(--success)', fontWeight: '600' }}>+ ₹{payment.amount}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>{payment.payment_type.replace('_', ' ')}</p>
                </div>
              </div>
            )) : (
              <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '20px' }}>No recent transactions.</p>
            )}
          </div>
          <Link href="/ledger" style={{ textDecoration: 'none' }}>
            <button style={{ 
              width: '100%', marginTop: '24px', padding: '12px', background: 'none', border: '1px solid var(--border)', 
              borderRadius: '12px', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' 
            }}>
              View Full Ledger
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
