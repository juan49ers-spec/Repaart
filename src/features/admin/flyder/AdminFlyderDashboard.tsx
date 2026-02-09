import React, { useState, useMemo, useCallback } from 'react';
import { TimeControlDashboard } from './components/TimeControlDashboard';
import { FleetIntelligenceDashboard } from './components/FleetIntelligenceDashboard';
import { BillingDashboard } from './components/BillingDashboard';
import NetworkDashboard from './components/NetworkDashboard';
import OrdersDashboard from './components/OrdersDashboard';
import FlyderOrdersDashboard from './components/FlyderOrdersDashboard';
import {
  Clock,
  TrendingUp,
  DollarSign,
  Network,
  Package,
  Database,
  Menu,
  X
} from 'lucide-react';

type TabType = 'time' | 'fleet' | 'billing' | 'network' | 'orders' | 'flyder';

interface AdminFlyderDashboardProps {
  franchiseId?: string;
}

interface TabConfig {
  id: TabType;
  label: string;
  description: string;
  icon: React.ElementType;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  iconBg: string;
  iconText: string;
}

const TABS: TabConfig[] = [
  {
    id: 'time',
    label: 'Control Horario',
    description: 'Turnos y horas trabajadas',
    icon: Clock,
    activeBg: 'bg-blue-50',
    activeBorder: 'border-blue-200',
    activeText: 'text-blue-900',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600'
  },
  {
    id: 'fleet',
    label: 'Fleet Intelligence',
    description: 'Análisis operativo y alertas',
    icon: TrendingUp,
    activeBg: 'bg-purple-50',
    activeBorder: 'border-purple-200',
    activeText: 'text-purple-900',
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600'
  },
  {
    id: 'billing',
    label: 'Facturación',
    description: 'Nóminas y cierres mensuales',
    icon: DollarSign,
    activeBg: 'bg-green-50',
    activeBorder: 'border-green-200',
    activeText: 'text-green-900',
    iconBg: 'bg-green-100',
    iconText: 'text-green-600'
  },
  {
    id: 'network',
    label: 'Red de Franquicias',
    description: 'Franquicias, tiendas y riders',
    icon: Network,
    activeBg: 'bg-orange-50',
    activeBorder: 'border-orange-200',
    activeText: 'text-orange-900',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600'
  },
  {
    id: 'orders',
    label: 'Historial de Pedidos',
    description: 'Todos los pedidos sincronizados',
    icon: Package,
    activeBg: 'bg-pink-50',
    activeBorder: 'border-pink-200',
    activeText: 'text-pink-900',
    iconBg: 'bg-pink-100',
    iconText: 'text-pink-600'
  },
  {
    id: 'flyder',
    label: 'Flyder MySQL',
    description: 'Datos en tiempo real de Flyder',
    icon: Database,
    activeBg: 'bg-cyan-50',
    activeBorder: 'border-cyan-200',
    activeText: 'text-cyan-900',
    iconBg: 'bg-cyan-100',
    iconText: 'text-cyan-600'
  }
];

export const AdminFlyderDashboard: React.FC<AdminFlyderDashboardProps> = ({ 
  franchiseId = '' 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('time');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = useCallback((tabId: TabType) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const renderDashboard = useMemo(() => {
    switch (activeTab) {
      case 'time':
        return <TimeControlDashboard franchiseId={franchiseId} />;
      case 'fleet':
        return <FleetIntelligenceDashboard franchiseId={franchiseId} />;
      case 'billing':
        return <BillingDashboard franchiseId={franchiseId} />;
      case 'network':
        return <NetworkDashboard />;
      case 'orders':
        return <OrdersDashboard />;
      case 'flyder':
        return <FlyderOrdersDashboard />;
      default:
        return <TimeControlDashboard franchiseId={franchiseId} />;
    }
  }, [activeTab, franchiseId]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header móvil */}
      <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <h1 className="font-bold text-slate-800">Admin Flyder</h1>
            <p className="text-xs text-slate-500">Hyper-Vision Module</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-1" aria-label="Navegación rápida">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`p-2 rounded-lg transition-colors ${
                  isActive 
                    ? `${tab.iconBg} ${tab.iconText}` 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </nav>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside 
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:static lg:translate-x-0 z-20 w-72 h-[calc(100vh-64px)] lg:h-auto bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out`}
          aria-label="Navegación principal"
        >
          <div className="p-6">
            <div className="mb-8 hidden lg:block">
              <h1 className="text-xl font-bold text-slate-800">Admin Flyder</h1>
              <p className="text-sm text-slate-500">Hyper-Vision Module</p>
            </div>

            <nav className="space-y-2" role="tablist" aria-label="Módulos Flyder">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl transition-all text-left ${
                      isActive 
                        ? `${tab.activeBg} border-2 ${tab.activeBorder}` 
                        : 'hover:bg-slate-50 border-2 border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${
                      isActive 
                        ? `${tab.iconBg} ${tab.iconText}` 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        isActive ? tab.activeText : 'text-slate-700'
                      }`}>
                        {tab.label}
                      </div>
                      <div className={`text-sm ${
                        isActive ? 'text-slate-600' : 'text-slate-500'
                      }`}>
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Info de franquicia */}
            {franchiseId && (
              <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Franquicia</p>
                <p className="font-medium text-slate-700 truncate" title={franchiseId}>
                  {franchiseId.slice(0, 16)}...
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Overlay móvil */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main 
          className="flex-1 p-4 lg:p-8 overflow-auto min-h-[calc(100vh-64px)] lg:min-h-screen"
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          <div className="max-w-7xl mx-auto">
            {renderDashboard}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminFlyderDashboard;
