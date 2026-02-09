import { useCallback } from 'react';
import { Shift } from '../../../schemas/scheduler';
import { ShiftInput, shiftService } from '../../../services/shiftService';
import { Rider } from '../../../store/useFleetStore';
import { notificationService } from '../../../services/notificationService';
import { toLocalDateString } from '../../../utils/dateUtils';

interface UseShiftActionsProps {
    franchiseId: string;
    readOnly?: boolean;
    localShifts: Shift[];
    deletedIds: Set<string>;
    mergedShifts: Shift[];
    rosterRiders: Rider[];
    setLocalShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
    setDeletedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setIsPublishing: (val: boolean) => void;
    setIsModalOpen: (val: boolean) => void;
    simpleRiders: { id: string; fullName: string; }[];
    weekData?: any;
}

export const useShiftActions = ({
    franchiseId,
    readOnly,
    localShifts,
    deletedIds,
    mergedShifts,
    rosterRiders,
    setLocalShifts,
    setDeletedIds,
    setIsPublishing,
    setIsModalOpen,
    simpleRiders,
    weekData
}: UseShiftActionsProps) => {

    const saveShift = useCallback(async (shiftData: Partial<Shift>) => {
        if (readOnly) {
            alert("Modo solo lectura: No se pueden guardar cambios.");
            return;
        }

        const newStart = new Date(shiftData.startAt!).getTime();
        const newEnd = new Date(shiftData.endAt!).getTime();
        const existingId = shiftData.id || shiftData.shiftId;

        const hasOverlap = mergedShifts.some(existing => {
            if (existing.riderId !== shiftData.riderId) return false;
            const existId = existing.id || existing.shiftId;
            if (String(existId) === String(existingId)) return false;

            const exStart = new Date(existing.startAt).getTime();
            const exEnd = new Date(existing.endAt).getTime();
            return (newStart < exEnd && newEnd > exStart);
        });

        if (hasOverlap) {
            alert("❌ COLISIÓN DETECTADA: Este rider ya tiene un turno asignado en ese horario. No se puede solapar.");
            return;
        }

        const isNewToken = !existingId || (typeof existingId === 'string' && existingId.startsWith('draft-'));
        const finalRiderId = String(shiftData.riderId!);
        const currentRider = simpleRiders.find(r => String(r.id) === finalRiderId);

        const finalShift: Shift = {
            ...shiftData,
            id: existingId || `draft-${crypto.randomUUID()}`,
            isDraft: true,
            isNew: isNewToken,
            changeRequested: false,
            changeReason: null,
            franchiseId: franchiseId,
            riderId: finalRiderId,
            riderName: currentRider?.fullName || shiftData.riderName || 'Rider',
            startAt: shiftData.startAt!,
            endAt: shiftData.endAt!,
            date: shiftData.date || toLocalDateString(new Date(shiftData.startAt!))
        };

        setLocalShifts(prev => {
            const filtered = prev.filter(s => String(s.id) !== String(finalShift.id));
            return [...filtered, finalShift];
        });

        setIsModalOpen(false);
    }, [readOnly, mergedShifts, franchiseId, setIsModalOpen, simpleRiders, setLocalShifts]);

    const deleteShift = useCallback((shiftId: string) => {
        if (readOnly) {
            alert("Modo solo lectura: No se pueden borrar turnos.");
            return;
        }
        const shiftIdStr = String(shiftId);
        if (shiftIdStr.startsWith('draft-')) {
            setLocalShifts(prev => prev.filter(s => String(s.id) !== shiftIdStr));
        } else {
            setDeletedIds(prev => {
                const newSet = new Set(prev);
                newSet.add(shiftIdStr);
                return newSet;
            });
            setLocalShifts(prev => prev.filter(s => String(s.id) !== shiftIdStr));
        }
    }, [readOnly, setLocalShifts, setDeletedIds]);

    const handlePublish = async () => {
        if (!franchiseId || readOnly) return;
        setIsPublishing(true);
        try {
            for (const id of deletedIds) {
                await shiftService.deleteShift(id);
            }
            for (const s of localShifts) {
                const shiftData: ShiftInput = {
                    franchiseId: franchiseId,
                    riderId: String(s.riderId),
                    riderName: s.riderName || rosterRiders.find(r => String(r.id) === String(s.riderId))?.fullName || 'Rider',
                    motoId: s.motoId || null,
                    motoPlate: s.motoPlate || '',
                    startAt: s.startAt,
                    endAt: s.endAt,
                    isConfirmed: s.isConfirmed
                };

                const isTrulyNew = (typeof s.id === 'string' && s.id.startsWith('draft-')) || !(weekData?.shifts || []).some((rs: any) => rs.id === s.id);

                if (isTrulyNew) {
                    await shiftService.createShift(shiftData as ShiftInput);
                } else {
                    await shiftService.updateShift(String(s.id), shiftData as Partial<ShiftInput>);
                }
            }

            try {
                await notificationService.notify(
                    'SCHEDULE_PUBLISHED',
                    franchiseId,
                    'Franquicia',
                    {
                        title: 'Horario Publicado',
                        message: `La franquicia ha publicado su horario para la semana.`,
                        priority: 'normal',
                        metadata: { franchiseId: franchiseId }
                    }
                );
            } catch (err) {
                console.warn("Error enviando notificación", err);
            }

            setLocalShifts([]);
            setDeletedIds(new Set());
        } catch (error) {
            console.error(error);
            alert("Error al publicar.");
        } finally {
            setIsPublishing(false);
        }
    };

    return {
        saveShift,
        deleteShift,
        handlePublish
    };
};
