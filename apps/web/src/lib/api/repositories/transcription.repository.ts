import { apiClient } from "../client";

interface TranscriptionResponse {
  transcription: string;
}

export class TranscriptionRepository {
  async transcribe(audioBlob: Blob, filename = "audio.webm"): Promise<string> {
    const formData = new FormData();
    formData.append("file", audioBlob, filename);

    const response = await apiClient.post<TranscriptionResponse>(
      "/transcription",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60_000,
      },
    );
    return response.data.transcription;
  }
}

export const transcriptionRepository = new TranscriptionRepository();
