import React from 'react';
import { Search, X } from 'lucide-react';
import { useThemeStyles } from '../../hooks/useThemeStyles';

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
  const { 
    cardBgClass, 
    borderClass, 
    textPrimaryClass, 
    textMutedClass 
  } = useThemeStyles();

  // Xử lý xóa nội dung
  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  const hasValue = value && String(value).length > 0;

  return (
    <div className={`relative ${containerClassName}`}>
      <Search 
        size={18} 
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`} 
      />
      <input
        value={value}
        onChange={onChange}
        className={`w-full pl-10 pr-10 h-[42px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${cardBgClass} ${borderClass} ${textPrimaryClass} placeholder-slate-500 ${className}`}
        {...props}
      />
      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${textMutedClass} transition-colors`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
