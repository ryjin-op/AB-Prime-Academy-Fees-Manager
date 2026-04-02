'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Plus,
  UserPlus, 
  FileUp, 
  FileText, 
  Settings 
} from 'lucide-react';
import { clsx } from 'clsx';

export default function Navbar() {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Ledger', href: '/ledger', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (pathname === '/login' || pathname === '/admin_registration') return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Left Side Items */}
        <div className="nav-group">
          {items.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={clsx('nav-item', isActive && 'active')}>
                <item.icon size={20} strokeWidth={isActive ? 3 : 2.5} />
                <span className="nav-label">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Central Action FAB */}
        <div className="fab-container" ref={menuRef}>
          <button 
            className={clsx('fab-button', showMenu && 'active')}
            onClick={() => setShowMenu(!showMenu)}
          >
            <Plus size={24} strokeWidth={3} />
          </button>

          <div className={clsx('fab-popover', showMenu && 'show')}>
            <Link href="/register" className="popover-item" onClick={() => setShowMenu(false)}>
              <UserPlus size={20} />
              <span>Register Student</span>
            </Link>
            <Link href="/bulk-upload" className="popover-item" onClick={() => setShowMenu(false)}>
              <FileUp size={20} />
              <span>Bulk Data Entry</span>
            </Link>
          </div>
        </div>

        {/* Right Side Items */}
        <div className="nav-group">
          {items.slice(2, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={clsx('nav-item', isActive && 'active')}>
                <item.icon size={20} strokeWidth={isActive ? 3 : 2.5} />
                <span className="nav-label">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
