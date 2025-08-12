import { Bell, Menu } from 'lucide-react';
import React from 'react';

const Header = () => {
    return (
      <header className="bg-black border-b border-gray-800 p-2">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <button className="text-white hover:text-gray-300 transition-colors">
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-neofara font-semibold tracking-wider">GERENCIADOR</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative text-white hover:text-gray-300 transition-colors">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">GN</span>
            </div>
            <span className="text-sm">GM-Nicki</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;