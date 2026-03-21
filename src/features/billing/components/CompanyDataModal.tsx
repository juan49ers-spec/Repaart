import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { Building2 } from 'lucide-react';
import { CompanyData } from '../hooks/useCompanyData';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    companyData: CompanyData | null;
    onSave: (values: CompanyData) => Promise<boolean>;
    loading: boolean;
}

export const CompanyDataModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    companyData, 
    onSave, 
    loading 
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (isOpen && companyData) {
            form.setFieldsValue(companyData);
        }
    }, [isOpen, companyData, form]);

    const handleFinish = async (values: CompanyData) => {
        const success = await onSave(values);
        if (success) {
            onClose();
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <span>Datos de la Empresa</span>
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={600}
            centered
        >
            <div className="py-4">
                <p className="text-slate-500 mb-6 text-sm">
                    Estos datos aparecerán como emisor en todas tus facturas. Es obligatorio completarlos antes de crear facturas.
                </p>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Nombre / Razón Social"
                        name="legalName"
                        rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                    >
                        <Input placeholder="Ej: Repaart Logistics S.L." />
                    </Form.Item>

                    <Form.Item
                        label="DNI / CIF"
                        name="cif"
                        rules={[{ required: true, message: 'El CIF es obligatorio' }]}
                    >
                        <Input placeholder="Ej: B12345678" />
                    </Form.Item>

                    <Form.Item
                        label="Teléfono de Contacto"
                        name="phone"
                        rules={[{ required: true, message: 'El teléfono es obligatorio para facturación' }]}
                    >
                        <Input placeholder="Ej: 600000000" />
                    </Form.Item>

                    <Form.Item
                        label="Dirección"
                        name="address"
                        rules={[{ required: true, message: 'La dirección es obligatoria' }]}
                    >
                        <Input placeholder="Ej: Calle Mayor 123" />
                    </Form.Item>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Form.Item
                            label="Código Postal"
                            name="zipCode"
                            rules={[{ required: true, message: 'Requerido' }]}
                        >
                            <Input placeholder="Ej: 28001" />
                        </Form.Item>

                        <Form.Item
                            label="Ciudad"
                            name="city"
                            rules={[{ required: true, message: 'Requerido' }]}
                            className="col-span-2"
                        >
                            <Input placeholder="Ej: Madrid" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="Provincia"
                        name="province"
                        rules={[{ required: true, message: 'La provincia es obligatoria' }]}
                    >
                        <Input placeholder="Ej: Madrid" />
                    </Form.Item>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Guardar Datos
                        </Button>
                    </div>
                </Form>
            </div>
        </Modal>
    );
};
