import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageAnalysis } from '@/hooks/useAi';
import * as aiService from '@/lib/ai';

vi.mock('@/lib/ai', async () => {
  const actual = await vi.importActual('@/lib/ai');
  return {
    ...actual,
    analyzeImage: vi.fn(),
  };
});

describe('useImageAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze image successfully', async () => {
    const mockAnalysis = 'A imagem mostra a evolução do paciente...';
    vi.mocked(aiService.analyzeImage).mockResolvedValue(mockAnalysis);

    const { result } = renderHook(() => useImageAnalysis());

    const imageUrl = 'https://example.com/image.jpg';
    const prompt = 'Analise a evolução';
    let response;
    await act(async () => {
      response = await result.current.analyze(imageUrl, prompt);
    });

    expect(response).toBe(mockAnalysis);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(aiService.analyzeImage).toHaveBeenCalledWith(imageUrl, prompt);
  });

  it('should handle errors during image analysis', async () => {
    const errorMessage = 'Erro ao analisar imagem';
    vi.mocked(aiService.analyzeImage).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useImageAnalysis());

    const imageUrl = 'https://example.com/image.jpg';
    const prompt = 'Analise a evolução';
    let error;
    await act(async () => {
      try {
        await result.current.analyze(imageUrl, prompt);
      } catch (e) {
        error = e;
      }
    });

    expect(error).toBeInstanceOf(Error);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.loading).toBe(false);
  });

  it('should set loading state during analysis', async () => {
    vi.mocked(aiService.analyzeImage).mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve('done'), 50));
    });

    const { result } = renderHook(() => useImageAnalysis());

    let analyzePromise;
    act(() => {
      analyzePromise = result.current.analyze('url', 'prompt');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await analyzePromise;
    });

    expect(result.current.loading).toBe(false);
  });
});
