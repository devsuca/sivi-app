
import { ReactNode, useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import PageLoader from '@/components/ui/PageLoader';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';


interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const router = useRouter();
  
  // Auto-logout logic
  useEffect(() => {
    // 3 minutes in milliseconds
    const INACTIVITY_TIMEOUT = 3 * 60 * 1000; 
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    const handleLogout = () => {
      // Optional: Show a message before redirecting?
      // For now, clean logout
      toast.info("Sessão expirada por inatividade.");
      logout();
      // logout usually handles redirection, but ensuring it here if needed
      // router.push('/login'); 
    };

    // Events to track activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    // Set up listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [logout]);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 200); // Reduzido para melhor UX
    return () => clearTimeout(timeout);
  }, []);
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-700 p-6 relative">
          {loading && <PageLoader />}
          <div className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
