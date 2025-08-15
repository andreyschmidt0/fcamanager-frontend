import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  showProgress?: boolean;
  progress?: number;
  fullScreen?: boolean;
  outlineOnly?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  text = 'Carregando...',
  showProgress = false,
  progress = 0,
  fullScreen = false,
  outlineOnly = false
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 z-50 bg-black flex flex-col items-center justify-center'
    : `flex flex-col items-center justify-center ${outlineOnly ? '' : 'bg-black'} ${className}`;

  return (
    <div className={containerClasses}>
      {/* Animação GIF */}
      <div className={`${sizeClasses[size]} relative mb-4`}>
        <img
          src="/imagens_gerais/output-onlinegiftools.gif"
          alt="Carregando..."
          width={128}
          height={128}
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Texto de carregamento */}
      {text && (
        <div className="text-center space-y-2">
          <p className="text-neutral-400 font-poppins text-sm">
            {text}
          </p>
          
          {/* Barra de progresso opcional */}
          {showProgress && (
            <div className="w-48 bg-neutral-800 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Indicadores visuais adicionais */}
      <div className="flex space-x-1 mt-3">
        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 