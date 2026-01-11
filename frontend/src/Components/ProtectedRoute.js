"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Loader } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // 1. Check if user exists in Redux (which loaded from localStorage)
    if (!user) {
      router.push('/login'); // Redirect if not logged in
    } else {
      setIsVerified(true);   // Allow access
    }
  }, [user, router]);

  // 2. Show a full-screen loader while checking (prevents "flash" of protected content)
  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-3">
           <Loader className="animate-spin text-brand-primary w-10 h-10 mx-auto" />
           <p className="text-sm text-slate-500 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // 3. If verified, render the protected page
  return <>{children}</>;
}