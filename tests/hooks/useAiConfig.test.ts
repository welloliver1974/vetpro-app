import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAiConfig } from '@/hooks/useAi';
import * as configStore from '@/lib/ai/config';

vi.mock('@/lib/ai/config', async () => {
  const actual = await vi.importActual('@/lib/ai/config');
  return {
    ...actual,
    loadConfigAsync: vi.fn(),
    saveConfig: vi.fn(),
    clearConfig: vi.fn(),
  };
});

describe('useAiConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading true and then set config', async () => {
    const mockConfig = {
      provider: 'groq',
      apiKey: 'test-key',
      chatModel: 'llama-3.3-70b-versatile',
      transcriptionModel: 'whisper-large-v3',
    };
    vi.mocked(configStore.loadConfigAsync).mockResolvedValue(mockConfig);

    const { result } = renderHook(() => useAiConfig());

    expect(result.current.loading).toBe(true);
    expect(result.current.config).toBe(null);

    // Wait for useEffect to complete
    await act(async () => {
      await Promise.resolve(); 
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.config).toEqual(mockConfig);
  });

  it('should handle empty config', async () => {
    vi.mocked(configStore.loadConfigAsync).mockResolvedValue(null);

    const { result } = renderHook(() => useAiConfig());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.config).toBe(null);
  });

  it('should save updated config', async () => {
    const initialConfig = {
      provider: 'groq',
      apiKey: 'old-key',
      chatModel: 'model-1',
      transcriptionModel: 'whisper',
    };
    const updatedConfig = { ...initialConfig, apiKey: 'new-key' };
    
    vi.mocked(configStore.loadConfigAsync).mockResolvedValue(initialConfig);

    const { result } = renderHook(() => useAiConfig());

    await act(async () => {
      await result.current.save(updatedConfig);
    });

    expect(configStore.saveConfig).toHaveBeenCalledWith(updatedConfig);
    expect(result.current.config).toEqual(updatedConfig);
  });

  it('should clear config', async () => {
    const initialConfig = {
      provider: 'groq',
      apiKey: 'test-key',
      chatModel: 'model-1',
      transcriptionModel: 'whisper',
    };
    vi.mocked(configStore.loadConfigAsync).mockResolvedValue(initialConfig);

    const { result } = renderHook(() => useAiConfig());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.clear();
    });

    expect(configStore.clearConfig).toHaveBeenCalled();
    expect(result.current.config).toBe(null);
  });
});
