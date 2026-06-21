import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProtocols, useCreateProtocol, useUpdateProtocol, useDeleteProtocol } from '@/hooks/useProtocols';
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

describe('useProtocols hooks', () => {
  let mockSupabase: typeof supabaseClient._mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = vi.mocked(supabaseClient._mockSupabase);
    mockSupabase.auth.getUser.mockReset();
  });

  describe('useProtocols', () => {
    it('should fetch protocols successfully', async () => {
      const mockProtocols = [
        { id: '1', equipamento_id: 'e1', nome: 'Protocolo Laser', descricao: 'Desc', configuracoes_padrao: { potencia: '10' }, created_at: '2024-01-01', equipments: { nome: 'Laser', modelo: 'XYZ' } },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockProtocols, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useProtocols(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.data).toEqual(mockProtocols);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle fetch error', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, new Error('DB Error'));
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useProtocols(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe('useCreateProtocol', () => {
    it('should create a protocol successfully', async () => {
      const mockUser = { data: { user: { id: 'vet-123' } } };
      const mockProtocol = { id: 'p-1', nome: 'Protocolo Laser' };

      mockSupabase.auth.getUser.mockResolvedValue(mockUser);
      const mockQueryBuilder = createMockQueryBuilder(mockProtocol, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useCreateProtocol(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ nome: 'Protocolo Laser', equipamento_id: 'e1' });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('protocols');
      expect(toast.success).toHaveBeenCalledWith('Protocolo criado!');
    });

    it('should throw error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const { result } = renderHook(() => useCreateProtocol(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ nome: 'Protocolo Laser' });
        } catch {}
      });

      expect(toast.error).toHaveBeenCalledWith('Usuário não autenticado');
    });
  });

  describe('useUpdateProtocol', () => {
    it('should update protocol successfully', async () => {
      const mockProtocol = { id: '1', nome: 'Protocolo Atualizado', descricao: 'Nova desc' };
      const mockQueryBuilder = createMockQueryBuilder(mockProtocol, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useUpdateProtocol(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ id: '1', data: { nome: 'Protocolo Atualizado', descricao: 'Nova desc' } });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('protocols');
      expect(toast.success).toHaveBeenCalledWith('Protocolo atualizado!');
    });
  });

  describe('useDeleteProtocol', () => {
    it('should delete protocol successfully', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useDeleteProtocol(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('protocols');
      expect(toast.success).toHaveBeenCalledWith('Protocolo removido!');
    });
  });
});