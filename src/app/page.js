'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check auth here, for now direct redirect
    router.push('/login');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div className="ios-card glass" style={{ padding: '40px', textAlign: 'center' }}>
        <h2 className="text-gradient">Initializing...</h2>
        <p style={{ color: 'var(--muted-foreground)' }}>AB Prime Academy Fee Manager</p>
      </div>
    </div>
  );
}
