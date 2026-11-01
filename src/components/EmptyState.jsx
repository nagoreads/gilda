import React from 'react';

export default function EmptyState({ icon = "", title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 my-8 bg-[#faf8f5] border border-[#e8e4d9] rounded-lg shadow-[0_2px_12px_rgba(40,30,20,0.03)] max-w-md mx-auto">
      <div className="w-10 h-10 rounded-full bg-[#f3efe6] border border-[#e2ddd0] flex items-center justify-center text-lg mb-3 shadow-inner">
        {icon}
      </div>
      <h3 className="font-serif text-base font-medium text-[#2c2825] mb-1 tracking-tight">
        {title}
      </h3>
      <p className="font-sans text-xs text-[#75706b] leading-relaxed mb-4 max-w-xs">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[#2c2825] text-[#faf8f5] text-xs font-sans rounded-md hover:bg-[#423d38] transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
