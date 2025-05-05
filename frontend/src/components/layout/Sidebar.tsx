import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaHome, FaUsers, FaExchangeAlt, FaChartPie, FaCog, FaUserFriends, FaBars, FaTimes } from 'react-icons/fa';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, label, icon, isActive, onClick }: NavItemProps) => {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isActive ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <div className="text-xl">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false); // Reset to closed when returning to desktop
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when clicking a link on mobile
  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
  return (
    <>
      {/* Hamburger menu for mobile */}
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-primary text-white rounded-lg shadow-md"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      )}

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside 
        className={`bg-white h-screen ${isMobile ? 'fixed' : 'sticky'} top-0 left-0 ${
          isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'w-64'
        } border-r border-gray-200 flex flex-col overflow-y-auto z-40 transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-2 rounded-lg">
              <span className="font-bold">FS</span>
            </div>
            <h1 className="text-xl font-bold text-primary">FairShare</h1>
          </div>
        </div>
        
        <nav className="p-4 flex flex-col gap-2 flex-grow">
          <NavItem 
            href="/dashboard" 
            label="Dashboard" 
            icon={<FaHome />} 
            isActive={pathname === '/dashboard'} 
            onClick={handleNavClick}
          />
          <NavItem 
            href="/groups" 
            label="My Groups" 
            icon={<FaUsers />} 
            isActive={pathname.startsWith('/groups')} 
            onClick={handleNavClick}
          />
          <NavItem 
            href="/friends" 
            label="Friends" 
            icon={<FaUserFriends />} 
            isActive={pathname.startsWith('/friends')} 
            onClick={handleNavClick}
          />
          <NavItem 
            href="/expenses" 
            label="Expenses" 
            icon={<FaExchangeAlt />} 
            isActive={pathname.startsWith('/expenses')} 
            onClick={handleNavClick}
          />
          <NavItem 
            href="/activity" 
            label="Activity" 
            icon={<FaChartPie />} 
            isActive={pathname === '/activity'} 
            onClick={handleNavClick}
          />
        </nav>
        
        <div className="mt-auto p-4 border-t border-gray-200">
          <NavItem 
            href="/settings" 
            label="Settings" 
            icon={<FaCog />} 
            isActive={pathname === '/settings'} 
            onClick={handleNavClick}
          />
        </div>
      </aside>
    </>
  );
} 