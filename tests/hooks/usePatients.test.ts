import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '@/hooks/usePatients';
import { toast } from 'sonner';
import React from 'react';

// We define the mock structure in a way that Vitest can hoist safely.
// By putting the logic inside vi.mock, we avoid the "Cannot access before initialization" error.
vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    auth: {
      getUser: vi.fn(),
    },
  };
  return {
    createClient: vi.fn(() => mockSupabase),
    // We attach the mock object to the module itself so we can retrieve it in tests
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
  
  return ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('usePatients hooks', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Correctly retrieve the mock object from the hoisted vi.mock
    const { _mockSupabase } = require('@/lib/supabase/client');
    mockSupabase = _mockSupabase;

    // Reset all mock functions
    mockSupabase.select.mockReset();
    mockSupabase.insert.mockReset();
    mockSupabase.update.mockReset();
    mockSupabase.delete.mockReset();
    mockSupabase.auth.getUser.mockReset();
    mockSupabase.single.mockReset();
  });

  describe('usePatients', () => {
    it('should fetch patients successfully', async () => {
      const mockPatients = [
        { id: '1', nome: 'Rex', especie: 'Cão', raca: 'Labrador', created_at: '2024-01-01' },
      ];
      
      mockSupabase.select.mockResolvedValue({ data: mockPatients, error: null });

      const { result } = renderHook(() => usePatients(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.data).toEqual(mockPatients);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle fetch error', async () => {
      mockSupabase.select.mockResolvedValue({ data: null, error: new Error('DB Error') });

      const { result } = renderHook(() => usePatients(), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe('useCreatePatient', () => {
    it('should create a patient successfully', async () => {
      const mockUser = { data: { user: { id: 'vet-123' } } };
      const mockPatient = { id: 'p-1', nome: 'Rex' };

      mockSupabase.auth.getUser.mockResolvedValue(mockUser);
      mockSupabase.single.mockResolvedValue({ data: mockPatient, error: null });

      const { result } = renderHook(() => useCreatePatient(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ nome: 'Rex' });
      });

      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Paciente cadastrado com sucesso!');
    });

    it('should throw error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const { result } = renderHook(() => useCreatePatient(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ nome: 'Rex' });
        } catch {}
      });

      expect(toast.error).toHaveBeenCalledWith('Usuário não autenticado');
    });
  });

  describe('useUpdatePatient', () => {
    it('should update patient successfully', async () => {
      const mockPatient = { id: '1', nome: 'Rex Updated' };
      mockSupabase.single.mockResolvedValue({ data: mockPatient, error: null });

      const { result } = renderHook(() => useUpdatePatient(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ id: '1', data: { nome: 'Rex Updated' } });
      });

      expect(mockSupabase.update).toHaveBeenCalledWith({ nome: 'Rex Updated' });
      expect(toast.success).toHaveBeenCalledWith('Paciente atualizado!');
    });
  });

  describe('useDeletePatient', () => {
    it('should delete patient successfully', async () => {
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useDeletePatient(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Paciente removido!');
    });
  });
});
