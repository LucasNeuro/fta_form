import React from 'react'

interface TableProps {
  children: React.ReactNode
  className?: string
}

interface TableHeaderProps {
  children: React.ReactNode
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className={`w-full bg-fta-gray/50 ${className}`}>
        {children}
      </table>
    </div>
  )
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children }) => {
  return (
    <thead className="bg-fta-gray border-b border-white/10">
      <tr>{children}</tr>
    </thead>
  )
}

export const TableHeaderCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
  return (
    <th className={`px-6 py-4 text-left text-sm font-semibold text-white/80 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

export const TableBody: React.FC<TableProps> = ({ children }) => {
  return <tbody className="divide-y divide-white/10">{children}</tbody>
}

export const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick }) => {
  const baseClasses = "hover:bg-fta-light-gray/50 transition-colors"
  const clickableClasses = onClick ? "cursor-pointer" : ""
  
  return (
    <tr 
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-white ${className}`}>
      {children}
    </td>
  )
}
