import React from 'react';

interface ToggleGroupProps {
  label?: string;
  opciones: string[];
  valores: string[];
  onChange: (nuevos: string[]) => void;
  disabled?: boolean;
}

const ToggleGroup: React.FC<ToggleGroupProps> = ({ 
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
    <div className="space-y-4">
      {label && (
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {label}
        </h4>
      )}
      <div className="flex flex-wrap gap-3">
        {opciones.map(opcion => (
          <button
            key={opcion}
            type="button"
            onClick={() => handleToggle(opcion)}
            disabled={disabled}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-tight transition-all border ${
              valores.includes(opcion)
                ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                : 'bg-white text-red-600 border-red-600/20 hover:bg-red-600/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {opcion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ToggleGroup;
