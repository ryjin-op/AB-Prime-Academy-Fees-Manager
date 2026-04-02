'use client';

import { clsx } from "clsx";
import { ChevronRight } from "lucide-react";

export default function DashboardCard({ title, value, subtext, icon: Icon, trend, trendColor, onClick }) {
  return (
    <div 
      className="ios-card glass" 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ padding: '8px', borderRadius: '12px', background: 'var(--secondary)', color: 'var(--primary)' }}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        {trend ? (
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: trendColor === 'danger' ? 'var(--danger)' : 'var(--success)' }}>
            {trend}
          </span>
        ) : onClick && (
          <div style={{ padding: '4px', color: 'var(--muted-foreground)' }}>
            <ChevronRight size={18} strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>{title}</h3>
        <p style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '4px' }}>{value}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>{subtext}</p>
      </div>
    </div>
  );
}
