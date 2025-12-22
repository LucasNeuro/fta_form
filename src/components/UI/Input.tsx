import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '',
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-white/90 text-sm font-semibold">{label}</label>
      <input
        className={`px-4 py-3 bg-fta-gray border border-fta-green/30 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-fta-green focus:border-fta-green transition-all ${className}`}
        {...props}
      />
      {error && <span className="text-red-400 text-sm">{error}</span>}
    </div>
  )
}

