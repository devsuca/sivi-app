import { useAuth } from '@/lib/auth';

export const useSupportAccess = () => {
  const { user } = useAuth();
  
  const isSupportUser = user?.role === 'suporte';
  const canManageTickets = isSupportUser;
  const canViewAllTickets = isSupportUser;
  const canAssignTickets = isSupportUser;
  
  return {
    isSupportUser,
    canManageTickets,
    canViewAllTickets,
    canAssignTickets,
    hasAccess: isSupportUser
  };
};
