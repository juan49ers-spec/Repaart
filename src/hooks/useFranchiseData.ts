import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface FranchiseFiscalData {
    legalName: string;
    cif: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    legalRepresentative: string;
    dniRepresentative: string;
    phone: string;
    email: string;
}

export interface FiscalValidation {
    isValid: boolean;
    missingFields: string[];
    errors: string[];
}

export const useFranchiseData = (userId: string | undefined) => {
    const [franchiseData, setFranchiseData] = useState<FranchiseFiscalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFranchiseData = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    
                    // Mapear datos fiscales del documento users
                    const fiscalData: FranchiseFiscalData = {
                        legalName: data.legalName || data.displayName || '',
                        cif: data.cif || data.taxId || '',
                        address: data.address || data.fiscalAddress || '',
                        city: data.city || '',
                        province: data.province || '',
                        postalCode: data.postalCode || data.zipCode || '',
                        legalRepresentative: data.legalRepresentative || data.representative || '',
                        dniRepresentative: data.dniRepresentative || data.representativeDni || '',
                        phone: data.phone || '',
                        email: data.email || ''
                    };

                    setFranchiseData(fiscalData);
                } else {
                    setError('No se encontraron datos del usuario');
                }
            } catch (err) {
                console.error('Error fetching franchise data:', err);
                setError('Error al cargar los datos fiscales');
            } finally {
                setLoading(false);
            }
        };

        fetchFranchiseData();
    }, [userId]);

    // Validar que los campos fiscales obligatorios estén completos
    const validateFiscalData = (data: FranchiseFiscalData | null): FiscalValidation => {
        if (!data) {
            return {
                isValid: false,
                missingFields: ['Todos los campos'],
                errors: ['No hay datos fiscales cargados']
            };
        }

        const requiredFields: (keyof FranchiseFiscalData)[] = [
            'legalName',
            'cif',
            'address',
            'city',
            'province',
            'postalCode',
            'legalRepresentative',
            'dniRepresentative'
        ];

        const missingFields: string[] = [];
        const errors: string[] = [];

        requiredFields.forEach(field => {
            if (!data[field] || (data[field] as string).trim() === '') {
                missingFields.push(field);
            }
        });

        // Validación específica de CIF/NIF español
        if (data.cif && !validateSpanishTaxId(data.cif)) {
            errors.push(`El CIF/NIF "${data.cif}" no tiene un formato válido español`);
        }

        // Validación de DNI del representante
        if (data.dniRepresentative && !validateSpanishDNI(data.dniRepresentative)) {
            errors.push(`El DNI del representante "${data.dniRepresentative}" no tiene un formato válido`);
        }

        return {
            isValid: missingFields.length === 0 && errors.length === 0,
            missingFields,
            errors
        };
    };

    const validation = validateFiscalData(franchiseData);

    return {
        franchiseData,
        loading,
        error,
        validation,
        isReady: !loading && validation.isValid
    };
};

// Validador de CIF/NIF español
export const validateSpanishTaxId = (taxId: string): boolean => {
    const cleanTaxId = taxId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleanTaxId.length !== 9) return false;
    
    const firstChar = cleanTaxId[0];
    const isCIF = 'ABCDEFGHJKLMNPQRSUVW'.includes(firstChar);
    const isNIF = 'XYZ'.includes(firstChar) || /^[0-9]/.test(firstChar);
    
    if (!isCIF && !isNIF) return false;
    
    // Validación básica de formato (puede mejorarse con algoritmo completo)
    return true;
};

// Validador de DNI español (con letra)
export const validateSpanishDNI = (dni: string): boolean => {
    const cleanDNI = dni.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleanDNI.length !== 9) return false;
    
    const numero = cleanDNI.substring(0, 8);
    const letra = cleanDNI.substring(8);
    
    if (!/^\d{8}$/.test(numero)) return false;
    
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const indice = parseInt(numero, 10) % 23;
    
    return letras[indice] === letra;
};

// Mapear datos de franquicia a placeholders
export const mapFranchiseToPlaceholders = (
    franchiseData: FranchiseFiscalData | null,
    adminData: any
): Record<string, string> => {
    if (!franchiseData) return {};

    return {
        'NOMBRE_DEL_FRANQUICIADO': franchiseData.legalName || adminData?.displayName || '',
        'CIF_FRANQUICIA': franchiseData.cif || '',
        'DIRECCIÓN_FRANQUICIA': franchiseData.address || '',
        'CIUDAD_FRANQUICIA': franchiseData.city || '',
        'PROVINCIA_FRANQUICIA': franchiseData.province || '',
        'CP_FRANQUICIA': franchiseData.postalCode || '',
        'REPRESENTANTE_LEGAL': franchiseData.legalRepresentative || '',
        'DNI_REPRESENTANTE': franchiseData.dniRepresentative || '',
        'TELÉFONO_FRANQUICIA': franchiseData.phone || '',
        'EMAIL_FRANQUICIA': franchiseData.email || ''
    };
};
