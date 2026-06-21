import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from '@/hooks/useAppointments';
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

describe('useAppointments hooks', () => {
  let mockSupabase: typeof supabaseClient._mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = vi.mocked(supabaseClient._mockSupabase);
    mockSupabase.auth.getUser.mockReset();
  });

  describe('useAppointments', () => {
    it('should fetch appointments successfully', async () => {
      const mockAppointments = [
        { id: '1', paciente_id: 'p1', data: '2024-01-15T10:00:00Z', tipo: 'fisio', status: 'agendado', valor: null, forma_pagamento: null, assinatura_url: null, created_at: '2024-01-01', patients: { nome: 'Rex', especie: 'Cão', endereco: 'Rua A' } },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockAppointments, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useAppointments(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.data).toEqual(mockAppointments);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle fetch error', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, new Error('DB Error'));
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useAppointments(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe('useCreateAppointment', () => {
    it('should create an appointment successfully', async () => {
      const mockUser = { data: { user: { id: 'vet-123' } } };
      const mockAppointment = { id: 'a-1', paciente_id: 'p1', data: '2024-01-15T10:00:00Z', tipo: 'fisio', status: 'agendado' };

      mockSupabase.auth.getUser.mockResolvedValue(mockUser);
      const mockQueryBuilder = createMockQueryBuilder(mockAppointment, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useCreateAppointment(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ paciente_id: 'p1', data: '2024-01-15T10:00:00Z', tipo: 'fisio' });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('appointments');
      expect(toast.success).toHaveBeenCalledWith('Atendimento agendado!');
    });

    it('should throw error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const { result } = renderHook(() => useCreateAppointment(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ paciente_id: 'p1', data: '2024-01-15T10:00:00Z', tipo: 'fisio' });
        } catch {}
      });

      expect(toast.error).toHaveBeenCalledWith('Usuário não autenticado');
    });
  });

  describe('useUpdateAppointment', () => {
    it('should update appointment successfully', async () => {
      const mockAppointment = { id: '1', status: 'concluido', valor: 150, forma_pagamento: 'pix' };
      const mockQueryBuilder = createMockQueryBuilder(mockAppointment, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useUpdateAppointment(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ id: '1', data: { status: 'concluido', valor: 150, forma_pagamento: 'pix' } });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('appointments');
      expect(toast.success).toHaveBeenCalledWith('Atendimento atualizado!');
    });
  });

  describe('useDeleteAppointment', () => {
    it('should delete appointment successfully', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useDeleteAppointment(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('appointments');
      expect(toast.success).toHaveBeenCalledWith('Atendimento removido!');
    });
  });
});