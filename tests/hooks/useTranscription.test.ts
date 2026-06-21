import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranscription } from '@/hooks/useAi';
import * as aiService from '@/lib/ai';

vi.mock('@/lib/ai', async () => {
  const actual = await vi.importActual('@/lib/ai');
  return {
    ...actual,
    transcribeAudio: vi.fn(),
  };
});

describe('useTranscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should transcribe audio successfully', async () => {
    const mockTranscription = 'Transcrição de teste do áudio';
    vi.mocked(aiService.transcribeAudio).mockResolvedValue(mockTranscription);

    const { result } = renderHook(() => useTranscription());

    const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
    let response;
    await act(async () => {
      response = await result.current.transcribe(mockBlob);
    });

    expect(response).toBe(mockTranscription);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(aiService.transcribeAudio).toHaveBeenCalledWith(mockBlob);
  });

  it('should handle errors during transcription', async () => {
    const errorMessage = 'Erro ao processar áudio';
    vi.mocked(aiService.transcribeAudio).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useTranscription());

    const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
    let error;
    await act(async () => {
      try {
        await result.current.transcribe(mockBlob);
      } catch (e) {
        error = e;
      }
    });

    expect(error).toBeInstanceOf(Error);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.loading).toBe(false);
  });

  it('should set loading state during transcription', async () => {
    vi.mocked(aiService.transcribeAudio).mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve('done'), 50));
    });

    const { result } = renderHook(() => useTranscription());

    const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
    let transcribePromise;
    act(() => {
      transcribePromise = result.current.transcribe(mockBlob);
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await transcribePromise;
    });

    expect(result.current.loading).toBe(false);
  });
});
