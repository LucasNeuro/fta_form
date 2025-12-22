import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  children: React.ReactNode
  as?: React.ElementType
  to?: string
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '',
  as: Component = 'button',
  to,
  ...props 
}) => {
  const baseClasses = 'px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-fta-green text-white hover:bg-fta-green/90',
    secondary: 'bg-fta-light-gray text-white hover:bg-fta-light-gray/80',
    outline: 'border border-white/20 text-white hover:bg-white/10'
  }

  const variantClass = variants[variant as keyof typeof variants] || variants.primary
  const classes = `${baseClasses} ${variantClass} ${className}`

  if (Component === 'a' || to) {
    return (
      <a href={to} className={classes} {...(props as any)}>
        {children}
      </a>
    )
  }

  return (
    <Component
      className={classes}
      {...props}
    >
      {children}
    </Component>
  )
}

