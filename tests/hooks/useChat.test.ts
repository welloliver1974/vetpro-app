import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '@/hooks/useAi';
import * as aiService from '@/lib/ai';

vi.mock('@/lib/ai', async () => {
  const actual = await vi.importActual('@/lib/ai');
  return {
    ...actual,
    chat: vi.fn(),
  };
});

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate text successfully', async () => {
    const mockResponse = 'Olá, eu sou a IA!';
    vi.mocked(aiService.chat).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useChat());

    let response;
    await act(async () => {
      response = await result.current.generate('Olá');
    });

    expect(response).toBe(mockResponse);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(aiService.chat).toHaveBeenCalledWith('Olá', undefined);
  });

  it('should handle errors during generation', async () => {
    const errorMessage = 'Erro de API';
    vi.mocked(aiService.chat).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useChat());

    let error;
    await act(async () => {
      try {
        await result.current.generate('Olá');
      } catch (e) {
        error = e;
      }
    });

    expect(error).toBeInstanceOf(Error);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.loading).toBe(false);
  });

  it('should set loading state during generation', async () => {
    vi.mocked(aiService.chat).mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve('done'), 50));
    });

    const { result } = renderHook(() => useChat());

    let generatePromise;
    act(() => {
      generatePromise = result.current.generate('Olá');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await generatePromise;
    });

    expect(result.current.loading).toBe(false);
  });
});
