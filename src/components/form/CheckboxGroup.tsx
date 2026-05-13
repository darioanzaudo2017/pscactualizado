import React from 'react';

interface CheckboxGroupProps {
  label: string;
  opciones: string[];
  valores: string[];
  onChange: (nuevos: string[]) => void;
  disabled?: boolean;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ 
  label, 
  opciones, 
  valores = [], 
  onChange, 
  disabled 
}) => {
  const handleToggle = (opcion: string) => {
    if (disabled) return;
    const nuevosValores = valores.includes(opcion)
      ? valores.filter(v => v !== opcion)
      : [...valores, opcion];
    onChange(nuevosValores);
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {opciones.map(opcion => (
          <label 
            key={opcion}
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
              valores.includes(opcion)
                ? 'bg-primary/5 border-primary/20 text-primary shadow-sm'
                : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={valores.includes(opcion)}
              onChange={() => handleToggle(opcion)}
              disabled={disabled}
              className="w-5 h-5 rounded-lg border-2 border-slate-300 text-primary focus:ring-primary/20"
            />
            <span className="text-sm font-bold truncate">{opcion}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CheckboxGroup;
