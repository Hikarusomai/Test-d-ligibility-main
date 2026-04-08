type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
};

function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = '',
}: ButtonProps) {
  const baseStyles = 'touch-target font-semibold rounded-lg transition-all duration-200 focus-ring inline-flex items-center justify-center';

  const variantStyles = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover active:bg-brand-primary-active disabled:bg-neutral-300 disabled:text-neutral-500 shadow-md hover:shadow-lg',
    secondary: 'bg-brand-secondary text-white hover:bg-brand-secondary-hover active:bg-brand-secondary-active disabled:bg-neutral-300 disabled:text-neutral-500 shadow-md hover:shadow-lg',
    outline: 'border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white disabled:border-neutral-300 disabled:text-neutral-400',
    ghost: 'text-brand-primary hover:bg-brand-primary/10 disabled:text-neutral-400',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${widthStyles}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default Button;
