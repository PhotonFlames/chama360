import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  HandCoins, 
  CircleAlert, 
  FileText, 
  Search, 
  Bell, 
  ShieldCheck,
  LogOut,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Role, Contribution, Loan, FinancialSummary } from './types';
import Login from './components/Login';
import AdminPage from './components/AdminPage';
import { Dashboard, Members, Contributions, Loans, Reports } from './components/Views';
import { api } from './api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  const [users, setUsers] = useState<User[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.getMe();
        if (data?.user) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsAuthReady(true);
      }
    };
    checkAuth();
  }, []);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    try {
      const [usersData, contributionsData, loansData] = await Promise.all([
        api.getUsers(),
        api.getContributions(),
        api.getLoans()
      ]);
      setUsers(usersData);
      setContributions(contributionsData);
      setLoans(loansData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for updates every 10 seconds since we don't have real-time sockets yet
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const summary: FinancialSummary = useMemo(() => {
    const totalCont = contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalLoans = loans.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.amount, 0);
    const totalPenalties = contributions.reduce((sum, c) => sum + (c.penalty || 0), 0);
    
    return {
      totalContributions: totalCont,
      totalLoansDisbursed: totalLoans,
      totalPenaltiesCollected: totalPenalties,
      availableBalance: totalCont + totalPenalties - totalLoans
    };
  }, [contributions, loans]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard summary={summary} />;
      case 'members': return <Members users={users} isAdmin={currentUser.role === 'Admin'} />;
      case 'contributions': return <Contributions contributions={contributions} isOfficial={['Admin', 'Treasurer'].includes(currentUser.role)} users={users} />;
      case 'loans': return <Loans loans={loans} currentUser={currentUser} />;
      case 'reports': return <Reports />;
      case 'admin': return <AdminPage users={users} />;
      default: return <Dashboard summary={summary} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-white/5 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/20">C</div>
            <h1 className="text-xl font-bold tracking-tight text-white">Chama360</h1>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-[0.2em]">Transparency First</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Users size={20} />} label="Members" active={activeTab === 'members'} onClick={() => setActiveTab('members')} />
          <NavItem icon={<HandCoins size={20} />} label="Contributions" active={activeTab === 'contributions'} onClick={() => setActiveTab('contributions')} />
          <NavItem icon={<CircleAlert size={20} />} label="Loans" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} />
          <NavItem icon={<FileText size={20} />} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          
          {currentUser.role === 'Admin' && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <p className="px-4 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">System</p>
              <NavItem icon={<ShieldCheck size={20} />} label="Admin Panel" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{currentUser.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{currentUser.role}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-zinc-900 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold capitalize text-white">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-white/5 rounded-full text-sm border-none focus:ring-2 focus:ring-emerald-500/20 w-64 transition-all text-white placeholder:text-zinc-600"
              />
            </div>
            <button className="p-2 text-zinc-500 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-zinc-900"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-zinc-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium text-sm",
        active 
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
          : "text-zinc-500 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
