import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePrescriptions, useCreatePrescription, useUpdatePrescription, useDeletePrescription } from '@/hooks/usePrescriptions';
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
    // eslint-disable-next-line unicorn/no-thenable
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

describe('usePrescriptions hooks', () => {
  let mockSupabase: typeof supabaseClient._mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = vi.mocked(supabaseClient._mockSupabase);
    mockSupabase.auth.getUser.mockReset();
  });

  describe('usePrescriptions', () => {
    it('should fetch prescriptions successfully', async () => {
      const mockPrescriptions = [
        { id: '1', vet_id: 'v1', patient_id: 'p1', items: [{ medicamento: 'Dipirona', dosagem: '500mg' }], observacoes: 'Tomar após as refeições', created_at: '2024-01-01', patients: { nome: 'Rex', especie: 'Cão', raca: 'Labrador' } },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockPrescriptions, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => usePrescriptions(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.data).toEqual(mockPrescriptions);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle fetch error', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, new Error('DB Error'));
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => usePrescriptions(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe('useCreatePrescription', () => {
    it('should create a prescription successfully', async () => {
      const mockUser = { data: { user: { id: 'vet-123' } } };
      const mockPrescription = { id: 'pr-1', patient_id: 'p1', items: [{ medicamento: 'Dipirona' }] };

      mockSupabase.auth.getUser.mockResolvedValue(mockUser);
      const mockQueryBuilder = createMockQueryBuilder(mockPrescription, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useCreatePrescription(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ patient_id: 'p1', items: [{ medicamento: 'Dipirona', dosagem: '500mg' }] });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('prescriptions');
      expect(toast.success).toHaveBeenCalledWith('Prescrição cadastrada!');
    });

    it('should throw error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const { result } = renderHook(() => useCreatePrescription(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ patient_id: 'p1', items: [{ medicamento: 'Dipirona' }] });
        } catch {}
      });

      expect(toast.error).toHaveBeenCalledWith('Usuário não autenticado');
    });
  });

  describe('useUpdatePrescription', () => {
    it('should update prescription successfully', async () => {
      const mockPrescription = { id: '1', items: [{ medicamento: 'Dipirona', dosagem: '1g' }], observacoes: 'Nova obs' };
      const mockQueryBuilder = createMockQueryBuilder(mockPrescription, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useUpdatePrescription(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ id: '1', data: { items: [{ medicamento: 'Dipirona', dosagem: '1g' }], observacoes: 'Nova obs' } });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('prescriptions');
      expect(toast.success).toHaveBeenCalledWith('Prescrição atualizada!');
    });
  });

  describe('useDeletePrescription', () => {
    it('should delete prescription successfully', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useDeletePrescription(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('prescriptions');
      expect(toast.success).toHaveBeenCalledWith('Prescrição removida!');
    });
  });
});