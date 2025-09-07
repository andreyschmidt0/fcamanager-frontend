import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconSize?: number;
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconSize = 20,
  children,
  className = '',
  loadingText
}) => {
  const baseClasses = 'flex items-center justify-center gap-2 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500',
    success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const disabledClasses = 'disabled:bg-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-500';

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={buttonClasses}
    >
      {loading ? (
        <>
          <Loader2 size={iconSize} className="animate-spin" />
          {loadingText || children}
        </>
      ) : (
        <>
          {Icon && <Icon size={iconSize} />}
          {children}
        </>
      )}
    </button>
  );
};

// Componentes pré-configurados para casos comuns
export const CancelButton: React.FC<Omit<ActionButtonProps, 'variant'>> = (props) => (
  <ActionButton variant="secondary" {...props} />
);

export const SubmitButton: React.FC<Omit<ActionButtonProps, 'type'>> = (props) => (
  <ActionButton type="submit" {...props} />
);

export const DangerButton: React.FC<Omit<ActionButtonProps, 'variant'>> = (props) => (
  <ActionButton variant="danger" {...props} />
);

export const PrimaryButton: React.FC<Omit<ActionButtonProps, 'variant'>> = (props) => (
  <ActionButton variant="primary" {...props} />
);

export default ActionButton;