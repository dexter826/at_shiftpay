import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  containerClassName?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ 
  onClear, 
  containerClassName = '', 
  value, 
  onChange, 
  className = '',
  ...props 
}) => {
  const hasValue = value && String(value).length > 0;

  const handleClear = () => {
    if (onClear) onClear();
  };

  return (
    <div className={`relative ${containerClassName}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
      <input
        value={value}
        onChange={onChange}
        className={`w-full pl-9 pr-9 h-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary transition-colors ${className}`}
        {...props}
      />
      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
