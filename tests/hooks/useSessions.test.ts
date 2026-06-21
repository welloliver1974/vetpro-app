import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSessionsByPatient, useSessionsByAppointment, useCreateSession, useUpdateSession } from '@/hooks/useSessions';
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
  const mockStorage = {
    from: vi.fn().mockReturnThis(),
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.jpg' } }),
  };
  mockStorage.from.mockImplementation(() => mockStorage);
  const mockSupabase = {
    from: vi.fn(() => createMockQueryBuilder()),
    storage: mockStorage,
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

describe('useSessions hooks', () => {
  let mockSupabase: typeof supabaseClient._mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = vi.mocked(supabaseClient._mockSupabase);
    mockSupabase.auth.getUser.mockReset();
    mockSupabase.storage.from.mockReset();
    mockSupabase.storage.upload.mockReset();
    mockSupabase.storage.getPublicUrl.mockReset();
  });

  describe('useSessionsByPatient', () => {
    it('should fetch sessions by patient successfully', async () => {
      const mockAppointments = [{ id: 'apt-1' }, { id: 'apt-2' }];
      const mockSessions = [
        { id: 's1', appointment_id: 'apt-1', protocolo_id: null, notas: 'Sessão 1', notas_evolucao: 'Evolução 1', custo: 50, foto_urls: [], created_at: '2024-01-15', appointments: { id: 'apt-1', data: '2024-01-15', tipo: 'fisio', valor: 150, patients: { nome: 'Rex', especie: 'Cão' } } },
      ];

      const mockAppointmentsQueryBuilder = createMockQueryBuilder(mockAppointments, null);
      const mockSessionsQueryBuilder = createMockQueryBuilder(mockSessions, null);

      mockSupabase.from
        .mockImplementationOnce(() => mockAppointmentsQueryBuilder)
        .mockImplementationOnce(() => mockSessionsQueryBuilder);

      const { result } = renderHook(() => useSessionsByPatient('patient-1'), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.data).toEqual(mockSessions);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should return empty array when no appointments', async () => {
      const mockAppointmentsQueryBuilder = createMockQueryBuilder([], null);

      mockSupabase.from.mockImplementationOnce(() => mockAppointmentsQueryBuilder);

      const { result } = renderHook(() => useSessionsByPatient('patient-1'), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('useSessionsByAppointment', () => {
    it('should fetch sessions by appointment successfully', async () => {
      const mockSessions = [
        { id: 's1', appointment_id: 'apt-1', protocolo_id: null, notas: 'Sessão 1', notas_evolucao: 'Evolução 1', custo: 50, foto_urls: [], created_at: '2024-01-15' },
      ];

      const mockQueryBuilder = createMockQueryBuilder(mockSessions, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useSessionsByAppointment('apt-1'), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.data).toEqual(mockSessions);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('useCreateSession', () => {
    it('should create a session successfully', async () => {
      const mockSession = { id: 's-1', appointment_id: 'apt-1', notas: 'Nova sessão' };
      const mockQueryBuilder = createMockQueryBuilder(mockSession, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useCreateSession(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ appointment_id: 'apt-1', notas: 'Nova sessão' });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
      expect(toast.success).toHaveBeenCalledWith('Sessão registrada!');
    });
  });

  describe('useUpdateSession', () => {
    it('should update session successfully', async () => {
      const mockSession = { id: 's-1', notas: 'Sessão atualizada', custo: 100 };
      const mockQueryBuilder = createMockQueryBuilder(mockSession, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const { result } = renderHook(() => useUpdateSession(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ id: 's-1', data: { notas: 'Sessão atualizada', custo: 100 } });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
      expect(toast.success).toHaveBeenCalledWith('Sessão atualizada!');
    });
  });
});