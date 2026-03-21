import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { message } from 'antd';

export interface CompanyData {
    legalName: string;
    cif: string;
    address: string;
    zipCode: string;
    city: string;
    province: string;
    phone: string;
}

export const useCompanyData = (franchiseId: string) => {
    const [companyData, setCompanyData] = useState<CompanyData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCompanyData = async () => {
            try {
                setLoading(true);
                const [franchiseDoc, userDoc] = await Promise.all([
                    getDoc(doc(db, 'franchises', franchiseId)),
                    getDoc(doc(db, 'users', franchiseId))
                ]);

                let mergedData: CompanyData = {
                    legalName: '',
                    cif: '',
                    address: '',
                    zipCode: '',
                    city: '',
                    province: '',
                    phone: ''
                };

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    mergedData = {
                        ...mergedData,
                        legalName: userData.legalName || userData.displayName || '',
                        cif: userData.cif || '',
                        phone: userData.phone || userData.phoneNumber || '',
                        address: userData.address || ''
                    };
                }

                if (franchiseDoc.exists()) {
                    const data = franchiseDoc.data();
                    mergedData = {
                        ...mergedData,
                        legalName: data.legalName || data.name || mergedData.legalName,
                        cif: data.cif || mergedData.cif,
                        phone: data.phone || data.phoneNumber || data.contactPhone || mergedData.phone,
                        address: data.address?.street || mergedData.address,
                        zipCode: data.address?.zipCode || '',
                        city: data.address?.city || '',
                        province: data.address?.province || ''
                    };
                }

                setCompanyData(mergedData);
            } catch (error) {
                console.error('Error loading company data:', error);
                message.error('Error al cargar datos de la franquicia');
            } finally {
                setLoading(false);
            }
        };

        if (franchiseId) {
            loadCompanyData();
        }
    }, [franchiseId]);

    const saveCompanyData = async (values: CompanyData) => {
        try {
            setLoading(true);
            const franchiseRef = doc(db, 'franchises', franchiseId);
            await setDoc(franchiseRef, {
                legalName: values.legalName,
                cif: values.cif,
                phone: values.phone,
                address: {
                    street: values.address,
                    zipCode: values.zipCode,
                    city: values.city,
                    province: values.province
                },
                updatedAt: serverTimestamp()
            }, { merge: true });

            setCompanyData(values);
            message.success('Datos de empresa actualizados correctamente');
            return true;
        } catch (error) {
            console.error('Error saving company data:', error);
            message.error('Error al guardar datos de empresa');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { companyData, loading, saveCompanyData };
};
