
import React, { useEffect, useState } from 'react';
import {
    Plus, Search, Edit2, LayoutGrid, List as ListIcon,
    User, Phone, Mail, ShieldCheck, Clock, Users,
    Star, Zap, Filter, Trophy, MoreHorizontal, Battery
} from 'lucide-react';
import { useFleetStore, Rider } from '../../store/useFleetStore';
import { Table, Column } from '../../components/ui/data-display/Table';
import { Button } from '../../components/ui/primitives/Button';
import { Drawer } from '../../components/ui/overlays/Drawer';
import { RiderForm } from './components/RiderForm';
import { cn } from '../../lib/utils';
import { getRiderInitials, getRiderColor } from '../../utils/colorPalette';
import { differenceInMonths, parseISO } from 'date-fns';

interface RidersViewProps {
    franchiseId?: string;
}

const getRiderLevel = (joinedAt: string | undefined) => {
    if (!joinedAt) return { label: 'En pruebas', color: 'text-slate-500', bg: 'bg-slate-100', borderColor: 'border-slate-200', value: 1 };

    let date: Date;
    try {
        date = parseISO(joinedAt);
    } catch {
        return { label: 'En pruebas', color: 'text-slate-500', bg: 'bg-slate-100', borderColor: 'border-slate-200', value: 1 };
    }

    const months = differenceInMonths(new Date(), date);

    if (months < 1) return { label: 'En pruebas', color: 'text-slate-500', bg: 'bg-slate-100', borderColor: 'border-slate-200', value: 1 };
    if (months >= 1 && months < 4) return { label: 'Profesional', color: 'text-blue-600', bg: 'bg-blue-50', borderColor: 'border-blue-200', value: 2 };
    return { label: 'Top Gun', color: 'text-amber-600', bg: 'bg-amber-50', borderColor: 'border-amber-200', value: 3 };
};

export const RidersView: React.FC<RidersViewProps> = ({ franchiseId }) => {
    const { riders, isLoading, fetchRiders } = useFleetStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
    const [search, setSearch] = useState('');

    // --- FILTERS STATE ---
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterLevel, setFilterLevel] = useState<'all' | 'top' | 'pro' | 'probation'>('all');

    useEffect(() => {
        fetchRiders(franchiseId);
    }, [fetchRiders, franchiseId]);

    const handleCreate = () => {
        setSelectedRider(null);
        setIsDrawerOpen(true);
    };

    const handleEdit = (rider: Rider) => {
        setSelectedRider(rider);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedRider(null);
    };

    // --- FILTER LOGIC ---
    const filteredRiders = riders.filter(r => {
        const matchesSearch = r.fullName.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all'
            ? r.status !== 'deleted'
            : filterStatus === 'active' ? (r.status === 'active' || r.status === 'on_route') : r.status === 'inactive';

        const level = getRiderLevel(r.metrics.joinedAt);
        let matchesLevel = true;
        if (filterLevel === 'top') matchesLevel = level.value === 3;
        if (filterLevel === 'pro') matchesLevel = level.value === 2;
        if (filterLevel === 'probation') matchesLevel = level.value === 1;

        return matchesSearch && matchesStatus && matchesLevel;
    });

    // --- METRICS & SPOTLIGHT ---
    const totalContractHours = riders.reduce((acc, r) => acc + (r.contractHours || 0), 0);
    const activeRiders = riders.filter(r => r.status !== 'deleted');
    const avgLevelValue = activeRiders.length > 0
        ? activeRiders.reduce((acc, r) => acc + getRiderLevel(r.metrics.joinedAt).value, 0) / activeRiders.length
        : 0;

    // Find "Rider of the Month" (Mock logic for now: High efficiency + High Rating)
    // In a real scenario, this would sort by a weighted score.
    const topPerformer = [...activeRiders].sort((a, b) => (b.metrics.efficiency || 0) - (a.metrics.efficiency || 0))[0];

    // --- RENDER HELPERS ---
    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={12}
                        className={cn(
                            rating >= star ? "fill-amber-400 text-amber-400 shadow-amber-200 drop-shadow-sm" : "text-slate-200 fill-slate-100"
                        )}
                    />
                ))}
            </div>
        );
    };

    // --- LIST COLUMNS ---
    const columns: Column<Rider>[] = [
        {
            header: 'Rider',
            cell: (rider) => (
                <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-white", getRiderColor(rider.id).bg)}>
                        {getRiderInitials(rider.fullName)}
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 dark:text-gray-100">{rider.fullName}</div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">{rider.email}</span>
                            {rider.id === topPerformer?.id && <Trophy size={10} className="text-amber-500" />}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Nivel & Status',
            cell: (rider) => {
                const level = getRiderLevel(rider.metrics.joinedAt);
                return (
                    <div className="flex flex-col gap-1">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit border", level.bg, level.color, level.borderColor)}>
                            {level.label}
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'Score',
            cell: (rider) => (
                <div className="flex flex-col gap-1">
                    {renderStars(rider.metrics.rating || 0)}
                    <span className="text-[10px] font-medium text-slate-400">Eff: {rider.metrics.efficiency || 0}%</span>
                </div>
            )
        },
        {
            header: 'Contrato',
            cell: (rider) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        {rider.contractHours || 0} h
                    </span>
                    <span className="text-[10px] text-slate-400">{rider.licenseType || '125cc'}</span>
                </div>
            )
        },
        {
            header: '',
            className: 'text-right',
            cell: (rider) => (
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(rider); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 h-full flex flex-col p-2">

            {/* 1. HEADER HERO METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                {/* Total Riders */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={64} className="text-indigo-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flota Total</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-slate-900">{activeRiders.length}</span>
                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Activos
                        </span>
                    </div>
                </div>

                {/* Contract Hours */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={64} className="text-blue-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capacidad Contratada</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-slate-900">{totalContractHours}<span className="text-lg text-slate-400 font-normal">h</span></span>
                    </div>
                </div>

                {/* Team Level */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldCheck size={80} className="text-purple-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nivel Medio</p>
                    <div className="mt-2">
                        <div className="text-xl font-bold text-slate-800">
                            {avgLevelValue >= 2.5 ? " Elite" : avgLevelValue >= 1.5 ? " Profesional" : " En Formación"}
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all duration-1000", avgLevelValue >= 2 ? "bg-purple-500" : "bg-orange-400")}
                                style={{ width: `${(avgLevelValue / 3) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* TOP PERFORMER SPOTLIGHT */}
                {topPerformer && (
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-0.5 rounded-2xl shadow-lg shadow-indigo-500/20 relative group hover:scale-[1.02] transition-transform">
                        <div className="bg-white/10 backdrop-blur-md h-full w-full rounded-[14px] p-4 flex items-center gap-4 relative overflow-hidden">
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                            <div className="relative">
                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg ring-2 ring-white/20", getRiderColor(topPerformer.id).bg)}>
                                    {getRiderInitials(topPerformer.fullName)}
                                </div>
                                <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 p-1 rounded-full shadow-lg border border-white/20">
                                    <Trophy size={10} strokeWidth={3} />
                                </div>
                            </div>

                            <div className="text-white">
                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Rider del Mes</p>
                                <p className="font-bold text-lg leading-none">{topPerformer.fullName}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex items-center gap-0.5 text-amber-300">
                                        <Zap size={12} fill="currentColor" />
                                        <span className="text-xs font-bold">{topPerformer.metrics.efficiency || 0}% Efic.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. ADVANCED TOOLBAR */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white p-2 pl-4 rounded-xl border border-slate-200 shadow-sm shrink-0">

                {/* Search & Filters Group */}
                <div className="flex flex-1 items-center gap-4 overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
                    {/* Search Input */}
                    <div className="relative w-64 shrink-0 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <div className="h-6 w-px bg-slate-200 shrink-0" />

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-lg">
                        <button onClick={() => setFilterStatus('all')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", filterStatus === 'all' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Todos</button>
                        <button onClick={() => setFilterStatus('active')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", filterStatus === 'active' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Activos</button>
                        <button onClick={() => setFilterStatus('inactive')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", filterStatus === 'inactive' ? "bg-white text-rose-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Inactivos</button>
                    </div>

                    {/* Level Filter Dropdown equivalent (Simplified as buttons for now) */}
                    <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-lg">
                        <Filter size={14} className="text-slate-400 ml-2 mr-1" />
                        <button onClick={() => setFilterLevel('all')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", filterLevel === 'all' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Cualquier Nivel</button>
                        <button onClick={() => setFilterLevel('top')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", filterLevel === 'top' ? "bg-white text-amber-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Top Gun</button>
                        <button onClick={() => setFilterLevel('probation')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", filterLevel === 'probation' ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Pruebas</button>
                    </div>
                </div>

                {/* View Toggles & Actions */}
                <div className="flex items-center gap-3 shrink-0 pl-4 border-l border-slate-100 xl:border-l-0">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("p-2 rounded-md transition-all", viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-2 rounded-md transition-all", viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                        >
                            <ListIcon size={16} />
                        </button>
                    </div>

                    <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 px-6">
                        Añadir Rider
                    </Button>
                </div>
            </div>

            {/* 3. CONTENT GRID/LIST */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-10">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="h-64 bg-slate-100 rounded-2xl" />)}
                    </div>
                ) : filteredRiders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                        <User className="w-16 h-16 mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-slate-600">No se encontraron riders</h3>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                        <button onClick={() => { setFilterLevel('all'); setFilterStatus('all'); setSearch('') }} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">Limpiar Filtros</button>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <Table
                            data={filteredRiders}
                            columns={columns}
                            isLoading={false}
                            onRowClick={handleEdit}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                        {filteredRiders.map(rider => {
                            const level = getRiderLevel(rider.metrics.joinedAt);
                            const isTop = rider.id === topPerformer?.id;

                            return (
                                <div
                                    key={rider.id}
                                    onClick={() => handleEdit(rider)}
                                    className={cn(
                                        "group relative bg-white rounded-[20px] transition-all duration-300 overflow-hidden cursor-pointer flex flex-col",
                                        "border border-slate-100 hover:border-indigo-200/50",
                                        "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(79,70,229,0.15)]",
                                        "hover:-translate-y-1"
                                    )}
                                >
                                    {/* Card Header Gradient */}
                                    <div className={cn("h-24 w-full absolute top-0 left-0 opacity-10 transition-opacity", isTop ? "bg-gradient-to-b from-amber-400 to-transparent opacity-20" : "bg-slate-50")} />

                                    {/* Action Menu (Hidden by default) */}
                                    <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/50 shadow-sm">
                                        <div className={cn("w-2 h-2 rounded-full", rider.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} />
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{rider.status}</span>
                                    </div>

                                    {/* MAIN CONTENT */}
                                    <div className="p-5 pt-10 flex flex-col items-center relative z-0 flex-1">
                                        {/* Avatar with Level Ring */}
                                        <div className="relative mb-3">
                                            <div className={cn(
                                                "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-xl ring-4 ring-white relative z-10",
                                                getRiderColor(rider.id).bg
                                            )}>
                                                {getRiderInitials(rider.fullName)}
                                            </div>
                                            {/* Decorative Level Badge */}
                                            <div className={cn("absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg border-2 border-white text-[9px] font-black uppercase text-white shadow-sm z-20",
                                                level.value === 3 ? "bg-amber-500" : level.value === 2 ? "bg-blue-500" : "bg-slate-400"
                                            )}>
                                                {level.label}
                                            </div>
                                        </div>

                                        <h3 className="font-black text-slate-800 text-lg text-center leading-tight mb-1 group-hover:text-indigo-700 transition-colors w-full truncate px-4">
                                            {rider.fullName}
                                        </h3>
                                        <p className="text-xs font-medium text-slate-400 mb-4">{rider.email}</p>

                                        {/* STAR RATING */}
                                        <div className="mb-6 flex flex-col items-center gap-1">
                                            {renderStars(rider.metrics.rating || 3)}
                                            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Valoración</span>
                                        </div>

                                        {/* STATS GRID */}
                                        <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center gap-1 group/stat hover:bg-slate-100 transition-colors">
                                                <Battery className={cn("w-4 h-4 mb-1", (rider.metrics.efficiency || 0) > 80 ? "text-emerald-500" : "text-slate-400")} />
                                                <span className="text-lg font-black text-slate-700 leading-none">{rider.metrics.efficiency || 0}%</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Eficiencia</span>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center gap-1 group/stat hover:bg-slate-100 transition-colors">
                                                <Clock className="w-4 h-4 text-indigo-500 mb-1" />
                                                <span className="text-lg font-black text-slate-700 leading-none">{rider.contractHours || 0}h</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Contrato</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* FOOTER ACTIONS (Quick Contact) */}
                                    <div className="p-3 border-t border-slate-50 bg-slate-50/50 flex justify-center gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <a href={`tel:${rider.phone}`} onClick={e => e.stopPropagation()} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-emerald-500 hover:shadow-sm transition-all">
                                            <Phone size={14} />
                                        </a>
                                        <span className="w-px h-4 bg-slate-200 self-center" />
                                        <a href={`mailto:${rider.email}`} onClick={e => e.stopPropagation()} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-blue-500 hover:shadow-sm transition-all">
                                            <Mail size={14} />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div >

            <Drawer
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                title={selectedRider ? 'Editar Rider' : 'Nuevo Rider'}
                description={selectedRider ? 'Modifica los datos del rider seleccionado' : 'Registra un nuevo miembro en la flota'}
            >
                <RiderForm
                    franchiseId={franchiseId}
                    onSuccess={handleCloseDrawer}
                    onCancel={handleCloseDrawer}
                    initialData={selectedRider ? {
                        ...selectedRider,
                        contractHours: selectedRider.contractHours || 40
                    } as any : undefined}
                />
            </Drawer>
        </div >
    );
};

export default RidersView;
