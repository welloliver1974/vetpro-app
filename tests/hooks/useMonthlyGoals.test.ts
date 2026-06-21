import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMonthlyGoals, useUpsertMonthlyGoal, useDeleteMonthlyGoal } from '@/hooks/useMonthlyGoals';
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
    upsert: vi.fn().mockReturnThis(),
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

describe('useMonthlyGoals hooks', () => {
  let mockSupabase: typeof supabaseClient._mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = vi.mocked(supabaseClient._mockSupabase);
    mockSupabase.auth.getUser.mockReset();
  });

  describe('useMonthlyGoals', () => {
    it('should fetch monthly goals successfully', async () => {
      const mockGoals = [
        { id: '1', vet_id: 'v1', mes: 1, ano: 2024, valor_meta: 5000, created_at: '2024-01-01' },
        { id: '2', vet_id: 'v1', mes: 2, ano: 2024, valor_meta: 6000, created_at: '2024-02-01' },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockGoals, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useMonthlyGoals(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.data).toEqual(mockGoals);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle fetch error', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, new Error('DB Error'));
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useMonthlyGoals(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe('useUpsertMonthlyGoal', () => {
    it('should upsert a monthly goal successfully', async () => {
      const mockUser = { data: { user: { id: 'vet-123' } } };
      const mockGoal = { id: 'g-1', vet_id: 'vet-123', mes: 1, ano: 2024, valor_meta: 5000 };

      mockSupabase.auth.getUser.mockResolvedValue(mockUser);
      const mockQueryBuilder = createMockQueryBuilder(mockGoal, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useUpsertMonthlyGoal(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ mes: 1, ano: 2024, valor_meta: 5000 });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('monthly_goals');
      expect(toast.success).toHaveBeenCalledWith('Meta salva com sucesso');
    });

    it('should throw error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const { result } = renderHook(() => useUpsertMonthlyGoal(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ mes: 1, ano: 2024, valor_meta: 5000 });
        } catch {}
      });

      expect(toast.error).toHaveBeenCalledWith('Erro ao salvar meta');
    });
  });

  describe('useDeleteMonthlyGoal', () => {
    it('should delete monthly goal successfully', async () => {
      const mockQueryBuilder = createMockQueryBuilder(null, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useDeleteMonthlyGoal(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('monthly_goals');
      expect(toast.success).toHaveBeenCalledWith('Meta removida');
    });
  });
});