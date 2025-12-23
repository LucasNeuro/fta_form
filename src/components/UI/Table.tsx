import React from 'react'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className={`overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)] border border-white/10 rounded-lg ${className}`}>
      <table className="w-full border-collapse min-w-full">
        {children}
      </table>
    </div>
  )
}

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <thead className="bg-fta-gray/50 sticky top-0 z-10">
      <tr className="border-b border-white/10">
        {children}
      </tr>
    </thead>
  )
}

export const TableHeaderCell: React.FC<{ 
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => {
  return (
    <th className={`px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <tbody className="bg-fta-dark divide-y divide-white/10">
      {children}
    </tbody>
  )
}

export const TableRow: React.FC<{ 
  children: React.ReactNode
  className?: string
  onClick?: () => void
}> = ({ children, className = '', onClick }) => {
  return (
    <tr 
      className={`hover:bg-white/5 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export const TableCell: React.FC<{ 
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-white ${className}`}>
      {children}
    </td>
  )
}
