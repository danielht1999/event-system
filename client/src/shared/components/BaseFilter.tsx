// client/src/shared/components/BaseFilter.tsx

import React from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  value?: string;
  onChange: (value: string) => void;
}

export interface BaseFilterProps {
  groups: FilterGroup[];
  className?: string;
  children?: React.ReactNode;
}

export const BaseFilter = ({
  groups,
  className = '',
  children,
}: BaseFilterProps) => {
  return (
    <div className={`reservation-filters ${className}`}>
      {groups.map((group) => (
        <div key={group.id} className="filter-group">
          <label htmlFor={group.id}>{group.label}</label>
          <select
            id={group.id}
            value={group.value || ''}
            onChange={(e) => group.onChange(e.target.value)}
          >
            {group.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      {/* Los children se renderizan aquí (badge + botones) */}
      {children}
    </div>
  );
};