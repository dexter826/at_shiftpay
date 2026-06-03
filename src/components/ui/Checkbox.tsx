import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, id }) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <label htmlFor={inputId} className="flex items-center gap-2 cursor-pointer select-none">
      <div className="relative">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className={`w-4 h-4 rounded border transition-colors ${
          checked
            ? 'bg-primary border-primary'
            : 'border-[var(--border-color)] bg-transparent'
        } peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20`}>
          {checked && <Check size={12} className="text-white absolute inset-0 m-auto" strokeWidth={3} />}
        </div>
      </div>
      {label && <span className="text-xs text-[var(--text-muted)]">{label}</span>}
    </label>
  );
};

export default Checkbox;
