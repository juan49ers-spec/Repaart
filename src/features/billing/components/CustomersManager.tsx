/**
 * Customers Manager Component
 * 
 * Gestión completa de clientes (restaurantes) para facturación
 * Permite crear, editar, ver y eliminar clientes
 * Incluye historial de facturas y métricas por cliente
 */

import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Button, 
    Space, 
    Tag, 
    Input,
    Row,
    Col,
    Tooltip,
    Popconfirm,
    message,
    Spin
} from 'antd';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    Building2,
    Search,
    Phone,
    Mail,
    MapPin,
    FileText
} from 'lucide-react';
import { useInvoicing } from '../../../hooks/useInvoicing';
import { CreateRestaurantModal } from '../../invoicing/components/CreateRestaurantModal';
import { CustomerInvoiceHistory } from './CustomerInvoiceHistory';
import { invoiceEngine } from '../../../services/billing/invoiceEngine';

interface Props {
    franchiseId: string;
}

interface Customer {
    id: string;
    fiscalName: string;
    cif: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        zipCode?: string;
        province?: string;
    };
    notes?: string;
    status: 'active' | 'inactive';
    createdAt?: string;
}

interface CustomerWithStats extends Customer {
    stats?: {
        totalInvoiced: number;
        totalPending: number;
        invoiceCount: number;
    };
}

export const CustomersManager: React.FC<Props> = ({ franchiseId }) => {
    const { getRestaurants, deleteRestaurant } = useInvoicing();
    const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [historyCustomer, setHistoryCustomer] = useState<{id: string; name: string} | null>(null);

    useEffect(() => {
        loadCustomers();
    }, [franchiseId]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const data = await getRestaurants(franchiseId);
            setCustomers(data || []);
            loadCustomerStats(data || []);
        } catch (error) {
            console.error('Error loading customers:', error);
            message.error('Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    const loadCustomerStats = async (customerList: Customer[]) => {
        if (!customerList.length) return;
        
        setLoadingStats(true);
        try {
            const statsPromises = customerList.map(async (customer) => {
                const result = await invoiceEngine.getCustomerStats(franchiseId, customer.id);
                if (result.success) {
                    return {
                        ...customer,
                        stats: {
                            totalInvoiced: result.data.totalInvoiced,
                            totalPending: result.data.totalPending,
                            invoiceCount: result.data.invoiceCount
                        }
                    };
                }
                return customer;
            });

            const customersWithStats = await Promise.all(statsPromises);
            setCustomers(customersWithStats);
        } catch (error) {
            console.error('Error loading customer stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleDelete = async (customerId: string) => {
        try {
            await deleteRestaurant({ id: customerId, franchiseId });
            message.success('Cliente eliminado correctamente');
            loadCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
            message.error('Error al eliminar cliente');
        }
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsEditModalOpen(true);
    };

    const handleViewHistory = (customer: Customer) => {
        setHistoryCustomer({ id: customer.id, name: customer.fiscalName });
    };

    const formatCurrency = (amount: number) => 
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

    const filteredCustomers = customers.filter(customer => 
        customer.fiscalName?.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.cif?.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'Cliente',
            key: 'customer',
            render: (_: unknown, record: CustomerWithStats) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900">{record.fiscalName}</div>
                        <div className="text-sm text-slate-500">{record.cif}</div>
                    </div>
                </div>
            )
        },
        {
            title: 'Contacto',
            key: 'contact',
            render: (_: unknown, record: CustomerWithStats) => (
                <div className="space-y-1">
                    {record.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4" />
                            {record.email}
                        </div>
                    )}
                    {record.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4" />
                            {record.phone}
                        </div>
                    )}
                    {!record.email && !record.phone && (
                        <span className="text-slate-400 text-sm">Sin contacto</span>
                    )}
                </div>
            )
        },
        {
            title: 'Dirección',
            key: 'address',
            render: (_: unknown, record: CustomerWithStats) => (
                record.address ? (
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                            {record.address.street && `${record.address.street}, `}
                            {record.address.city}
                            {record.address.zipCode && ` ${record.address.zipCode}`}
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-400 text-sm">Sin dirección</span>
                )
            )
        },
        {
            title: 'Facturado',
            key: 'invoiced',
            width: 120,
            render: (_: unknown, record: CustomerWithStats) => (
                loadingStats ? (
                    <Spin size="small" />
                ) : record.stats ? (
                    <div className="text-right">
                        <div className="font-semibold text-slate-900">
                            {formatCurrency(record.stats.totalInvoiced)}
                        </div>
                        <div className="text-xs text-slate-500">
                            {record.stats.invoiceCount} facturas
                        </div>
                    </div>
                ) : (
                    <span className="text-slate-400">-</span>
                )
            )
        },
        {
            title: 'Pendiente',
            key: 'pending',
            width: 100,
            render: (_: unknown, record: CustomerWithStats) => (
                loadingStats ? (
                    <Spin size="small" />
                ) : record.stats ? (
                    <div className={`text-right font-semibold ${record.stats.totalPending > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {formatCurrency(record.stats.totalPending)}
                    </div>
                ) : (
                    <span className="text-slate-400">-</span>
                )
            )
        },
        {
            title: 'Estado',
            key: 'status',
            width: 80,
            render: (_: unknown, record: CustomerWithStats) => (
                <Tag color={record.status === 'active' ? 'green' : 'default'}>
                    {record.status === 'active' ? 'Activo' : 'Inactivo'}
                </Tag>
            )
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 150,
            render: (_: unknown, record: CustomerWithStats) => (
                <Space size="small">
                    <Tooltip title="Ver facturas">
                        <Button
                            type="text"
                            icon={<FileText className="w-4 h-4" />}
                            onClick={() => handleViewHistory(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Editar">
                        <Button
                            type="text"
                            icon={<Edit2 className="w-4 h-4" />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="¿Eliminar cliente?"
                        description="Esta acción no se puede deshacer. Las facturas existentes se mantendrán."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Eliminar"
                        okButtonProps={{ danger: true }}
                        cancelText="Cancelar"
                    >
                        <Tooltip title="Eliminar">
                            <Button
                                type="text"
                                danger
                                icon={<Trash2 className="w-4 h-4" />}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <Card>
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24} md={12} lg={8}>
                        <Input
                            placeholder="Buscar por nombre, CIF o email..."
                            prefix={<Search className="w-4 h-4 text-slate-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={12} lg={16} className="flex justify-end">
                        <Button
                            type="primary"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Nuevo Cliente
                        </Button>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={filteredCustomers}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `${total} clientes`
                    }}
                    locale={{
                        emptyText: (
                            <div className="text-center py-8">
                                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <div className="text-slate-500 mb-2">No hay clientes registrados</div>
                                <div className="text-sm text-slate-400 mb-4">
                                    Crea tu primer cliente para comenzar a facturar
                                </div>
                                <Button
                                    type="primary"
                                    icon={<Plus className="w-4 h-4" />}
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Crear Cliente
                                </Button>
                            </div>
                        )
                    }}
                />
            </Card>

            <CreateRestaurantModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    loadCustomers();
                    setIsCreateModalOpen(false);
                }}
                franchiseId={franchiseId}
            />

            {selectedCustomer && (
                <CreateRestaurantModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedCustomer(null);
                    }}
                    onSuccess={() => {
                        loadCustomers();
                        setIsEditModalOpen(false);
                        setSelectedCustomer(null);
                    }}
                    restaurant={selectedCustomer}
                    franchiseId={franchiseId}
                />
            )}

            {historyCustomer && (
                <CustomerInvoiceHistory
                    isOpen={true}
                    onClose={() => setHistoryCustomer(null)}
                    customerId={historyCustomer.id}
                    customerName={historyCustomer.name}
                    franchiseId={franchiseId}
                />
            )}
        </div>
    );
};

export default CustomersManager;
