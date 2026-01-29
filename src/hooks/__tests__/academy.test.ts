import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as academyService from '../../services/academyService';
import { useAcademyModules, useAcademyModule, useAcademyLessons } from '../academy';
import type { AcademyModule, AcademyLesson } from '../../services/academyService';

// Mock academyService
vi.mock('../../services/academyService', () => ({
  academyService: {
    getAllModules: vi.fn(),
    getModuleById: vi.fn(),
    getLessonsByModule: vi.fn(),
  },
}));

describe('useAcademyModules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch modules on mount', async () => {
    const mockModules: AcademyModule[] = [
      {
        id: '1',
        title: 'Módulo 1',
        description: 'Descripción',
        order: 1,
        status: 'active',
      },
    ];

    vi.mocked(academyService.academyService.getAllModules).mockResolvedValue(mockModules);

    const { result } = renderHook(() => useAcademyModules());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.modules).toEqual(mockModules);
    expect(academyService.academyService.getAllModules).toHaveBeenCalledTimes(1);
  });

  it('should fetch only active modules when status is "active"', async () => {
    const mockModules: AcademyModule[] = [
      {
        id: '1',
        title: 'Módulo Activo',
        description: 'Descripción',
        order: 1,
        status: 'active',
      },
    ];

    vi.mocked(academyService.academyService.getAllModules).mockResolvedValue(mockModules);

    const { result } = renderHook(() => useAcademyModules('active'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(academyService.academyService.getAllModules).toHaveBeenCalledWith('active');
  });

  it('should handle errors', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(academyService.academyService.getAllModules).mockRejectedValue(error);

    const { result } = renderHook(() => useAcademyModules());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should refetch modules when refetch is called', async () => {
    const mockModules: AcademyModule[] = [
      {
        id: '1',
        title: 'Módulo 1',
        description: 'Descripción',
        order: 1,
        status: 'active',
      },
    ];

    vi.mocked(academyService.academyService.getAllModules).mockResolvedValue(mockModules);

    const { result } = renderHook(() => useAcademyModules());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(academyService.academyService.getAllModules).toHaveBeenCalledTimes(2);
  });
});

describe('useAcademyModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch module by id', async () => {
    const mockModule: AcademyModule = {
      id: '1',
      title: 'Módulo 1',
      description: 'Descripción',
      order: 1,
      status: 'active',
    };

    vi.mocked(academyService.academyService.getModuleById).mockResolvedValue(mockModule);

    const { result } = renderHook(() => useAcademyModule('1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.module).toEqual(mockModule);
    expect(academyService.academyService.getModuleById).toHaveBeenCalledWith('1');
  });

  it('should not fetch when moduleId is null', () => {
    const { result } = renderHook(() => useAcademyModule(null));

    expect(result.current.module).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(academyService.academyService.getModuleById).not.toHaveBeenCalled();
  });

  it('should handle module not found', async () => {
    vi.mocked(academyService.academyService.getModuleById).mockResolvedValue(null);

    const { result } = renderHook(() => useAcademyModule('999'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.module).toBe(null);
  });

  it('should handle errors', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(academyService.academyService.getModuleById).mockRejectedValue(error);

    const { result } = renderHook(() => useAcademyModule('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useAcademyLessons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch lessons for a module', async () => {
    const mockLessons: AcademyLesson[] = [
      {
        id: '1',
        module_id: 'mod1',
        title: 'Lección 1',
        content: 'Contenido',
        content_type: 'text',
        duration: 10,
        order: 1,
        status: 'published',
      },
    ];

    vi.mocked(academyService.academyService.getLessonsByModule).mockResolvedValue(mockLessons);

    const { result } = renderHook(() => useAcademyLessons('mod1', 'published'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lessons).toEqual(mockLessons);
    expect(academyService.academyService.getLessonsByModule).toHaveBeenCalledWith('mod1', 'published');
  });

  it('should not fetch when moduleId is null', () => {
    const { result } = renderHook(() => useAcademyLessons(null));

    expect(result.current.lessons).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(academyService.academyService.getLessonsByModule).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(academyService.academyService.getLessonsByModule).mockRejectedValue(error);

    const { result } = renderHook(() => useAcademyLessons('mod1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
  });
});
