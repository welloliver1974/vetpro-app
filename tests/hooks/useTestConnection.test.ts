import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTestConnection } from '@/hooks/useAi';
import * as aiService from '@/lib/ai';

vi.mock('@/lib/ai', async () => {
  const actual = await vi.importActual('@/lib/ai');
  return {
    ...actual,
    testConnection: vi.fn(),
  };
});

describe('useTestConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success when connection is OK', async () => {
    vi.mocked(aiService.testConnection).mockResolvedValue(true);

    const { result } = renderHook(() => useTestConnection());

    const mockConfig = {
      provider: 'groq',
      apiKey: 'test-key',
      chatModel: 'model',
      transcriptionModel: 'whisper',
    };

    let ok;
    await act(async () => {
      ok = await result.current.test(mockConfig);
    });

    expect(ok).toBe(true);
    expect(result.current.result).toBe('success');
    expect(result.current.loading).toBe(false);
    expect(aiService.testConnection).toHaveBeenCalledWith(mockConfig);
  });

  it('should return fail when connection fails', async () => {
    vi.mocked(aiService.testConnection).mockResolvedValue(false);

    const { result } = renderHook(() => useTestConnection());

    const mockConfig = {
      provider: 'groq',
      apiKey: 'invalid-key',
      chatModel: 'model',
      transcriptionModel: 'whisper',
    };

    let ok;
    await act(async () => {
      ok = await result.current.test(mockConfig);
    });

    expect(ok).toBe(false);
    expect(result.current.result).toBe('fail');
    expect(result.current.loading).toBe(false);
  });

  it('should handle errors during connection test', async () => {
    vi.mocked(aiService.testConnection).mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useTestConnection());

    const mockConfig = {
      provider: 'groq',
      apiKey: 'test-key',
      chatModel: 'model',
      transcriptionModel: 'whisper',
    };

    let ok;
    await act(async () => {
      ok = await result.current.test(mockConfig);
    });

    expect(ok).toBe(false);
    expect(result.current.result).toBe('fail');
    expect(result.current.loading).toBe(false);
  });

  it('should set loading state during test', async () => {
    vi.mocked(aiService.testConnection).mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve(true), 50));
    });

    const { result } = renderHook(() => useTestConnection());

    let testPromise;
    act(() => {
      testPromise = result.current.test({
        provider: 'groq',
        apiKey: 'key',
        chatModel: 'model',
        transcriptionModel: 'whisper',
      });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await testPromise;
    });

    expect(result.current.loading).toBe(false);
  });
});
