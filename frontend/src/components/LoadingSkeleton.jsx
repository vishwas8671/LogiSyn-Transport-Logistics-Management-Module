import React from 'react';
export const CardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      <div className="w-8 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
    </div>
    <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded mt-4"></div>
    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
  </div>
);
export const ChartSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-6 h-80 animate-pulse flex flex-col justify-between">
    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
    <div className="flex items-end justify-between h-48 w-full gap-4">
      <div className="w-full h-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="w-full h-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="w-full h-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="w-full h-full bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="w-full h-4/5 bg-slate-200 dark:bg-slate-800 rounded"></div>
    </div>
    <div className="flex justify-between w-full">
      <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-hidden animate-pulse">
    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
      <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
    </div>
    <div className="p-4 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between items-center gap-4 py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
          <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-1/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-1/5 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        </div>
      ))}
    </div>
  </div>
);
