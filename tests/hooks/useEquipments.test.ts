import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEquipments, useCreateEquipment, useUpdateEquipment, useDeleteEquipment } from '@/hooks/useEquipments';
import { toast } from 'sonner';
import * as supabaseClient from '@/lib/supabase/client';
import React from 'react';

type MockData = Record<string, unknown>[] | Record<string, unknown> | null;
type MockError = Error | null;

const createMockQueryBuilder = (mockData: MockData = null, mockError: MockError = null) => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    
    then: vi.fn().mockImplementation((onFulfilled) => Promise.resolve({ data: mockData, error: mockError }).then(onFulfilled)),
  };
  return builder;
};

vi.mock('@/lib/supabase/client', async () => {
  const actual = await vi.importActual('@/lib/supabase/client');
  const mockSupabase = {
    from: vi.fn(() => createMockQueryBuilder()),
    auth: {
      getUser: vi.fn(),
    },
  };
  return {
    ...actual,
    createClient: vi.fn(() => mockSupabase),
    _mockSupabase: mockSupabase,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('useEquipments hooks', () => {
  let mockSupabase: typeof supabaseClient._mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = vi.mocked(supabaseClient._mockSupabase);
    mockSupabase.auth.getUser.mockReset();
  });

  describe('useEquipments', () => {
    it('should fetch equipments successfully', async () => {
      const mockEquipments = [
        { id: '1', nome: 'Laser', modelo: 'XYZ', ultima_manutencao: '2024-01-01', created_at: '2024-01-01' },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockEquipments, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useEquipments(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.data).toEqual(mockEquipments);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle fetch error', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, new Error('DB Error'));
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useEquipments(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe('useCreateEquipment', () => {
    it('should create an equipment successfully', async () => {
      const mockUser = { data: { user: { id: 'vet-123' } } };
      const mockEquipment = { id: 'e-1', nome: 'Laser' };

      mockSupabase.auth.getUser.mockResolvedValue(mockUser);
      const mockQueryBuilder = createMockQueryBuilder(mockEquipment, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useCreateEquipment(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ nome: 'Laser' });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('equipments');
      expect(toast.success).toHaveBeenCalledWith('Equipamento cadastrado!');
    });

    it('should throw error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const { result } = renderHook(() => useCreateEquipment(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ nome: 'Laser' });
        } catch {}
      });

      expect(toast.error).toHaveBeenCalledWith('Usuário não autenticado');
    });
  });

  describe('useUpdateEquipment', () => {
    it('should update equipment successfully', async () => {
      const mockEquipment = { id: '1', nome: 'Laser Atualizado' };
      const mockQueryBuilder = createMockQueryBuilder(mockEquipment, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useUpdateEquipment(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ id: '1', data: { nome: 'Laser Atualizado' } });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('equipments');
      expect(toast.success).toHaveBeenCalledWith('Equipamento atualizado!');
    });
  });

  describe('useDeleteEquipment', () => {
    it('should delete equipment successfully', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useDeleteEquipment(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('equipments');
      expect(toast.success).toHaveBeenCalledWith('Equipamento removido!');
    });
  });
});