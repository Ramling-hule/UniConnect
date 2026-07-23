"use client";
import ConnectionsView from '@/Components/Views/ConnectionsView';

export default function ConnectionsPage() {
  return (
    <div className="pb-10 max-w-3xl mx-auto w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight capitalize dark:text-white text-slate-900">
          Connections
        </h2>
      </div>
      <ConnectionsView />
    </div>
  );
}
