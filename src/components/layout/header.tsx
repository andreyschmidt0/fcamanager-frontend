import { Bell, Menu, ChevronDown, LogOut, Shield } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGMRole } from '../../hooks/useGMRole';
import { useGMManagement } from '../../hooks/useGMManagement';
import GMManagement from '../modal/gmmanagement/GMManagement';

const Header = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { isMaster, loading } = useGMRole();
  const { isGMManagementOpen, openGMManagement, closeGMManagement } = useGMManagement();

  const handleLogout = () => {
    logout();
  };


  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
    return (
      <header className="bg-black border-b border-gray-800 p-2">
      <div className="relative flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <button className="text-white hover:text-gray-300 transition-colors">
            <Menu size={24}
/>
          </button>
        </div>
        
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-2xl font-neofara font-semibold tracking-wider">GERENCIADOR</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative text-white hover:text-gray-300 transition-colors">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.profile.nickname ? user.profile.nickname.substring(0, 2).toUpperCase() : 'GM'}
                </span>
              </div>
              <span className="text-sm">
              {user?.profile.nickname || 'Admin'}
              </span>
              <ChevronDown 
                size={16} 
                className={`transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`}
              />
            </button>
            
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-[#1d1e24] rounded-lg shadow-lg border border-gray-600 z-50">
                {/* Mostrar botão GM Management apenas para Masters */}
                {isMaster && !loading && (
                  <button
                    onClick={() => {
                      openGMManagement();
                      setShowProfileDropdown(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Shield size={16} />
                    <span>Gerenciar GMs</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setShowProfileDropdown(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GM Management Modal */}
      <GMManagement 
        isOpen={isGMManagementOpen} 
        onClose={closeGMManagement} 
      />
    </header>
  );
};

export default Header;