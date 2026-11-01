import React from 'react';

export const MuroSkeleton = () => (
  <div className="space-y-4 w-full animate-pulse p-2">
    {[1, 2, 3].map((n) => (
      <div key={n} className="p-4 border border-[#e8e4d9] rounded-xl bg-[#faf9f5]/70 space-y-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#e8e4d9]" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-32 bg-[#e8e4d9] rounded" />
            <div className="h-2.5 w-20 bg-[#e8e4d9]/60 rounded" />
          </div>
        </div>
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full bg-[#e8e4d9]/80 rounded" />
          <div className="h-3 w-4/5 bg-[#e8e4d9]/60 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export const HabitacionSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full animate-pulse p-2">
    {[1, 2, 3, 4, 5, 6].map((n) => (
      <div key={n} className="p-3 border border-[#e8e4d9] rounded-xl bg-[#faf9f5]/70 space-y-2.5 shadow-sm">
        <div className="w-full aspect-[2/3] bg-[#e8e4d9] rounded-lg" />
        <div className="h-3.5 w-3/4 bg-[#e8e4d9] rounded mt-2" />
        <div className="h-2.5 w-1/2 bg-[#e8e4d9]/60 rounded" />
      </div>
    ))}
  </div>
);
