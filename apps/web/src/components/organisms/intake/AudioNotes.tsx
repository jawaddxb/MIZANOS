"use client";

import * as React from "react";

import { Mic, Square, Play, Pause, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/molecules/buttons/Button";
import type { AudioNote } from "./types";

interface AudioNotesProps {
  onNotesChange: (notes: AudioNote[]) => void;
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioNotes({ onNotesChange, className }: AudioNotesProps) {
  const [notes, setNotes] = React.useState<AudioNote[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [playingId, setPlayingId] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRefs = React.useRef<Map<string, HTMLAudioElement>>(new Map());

  const startRecording = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const noteId = crypto.randomUUID();
        const objectUrl = URL.createObjectURL(blob);
        const newNote: AudioNote = {
          id: noteId,
          blob,
          objectUrl,
          isTranscribing: true,
        };

        setNotes((prev) => {
          const updated = [...prev, newNote];
          onNotesChange(updated);
          return updated;
        });

        stream.getTracks().forEach((track) => track.stop());

        transcribeAudio(noteId);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, [onNotesChange]);

  const updateNoteTranscription = React.useCallback(
    (noteId: string, transcription: string) => {
      setNotes((prev) => {
        const updated = prev.map((n) =>
          n.id === noteId ? { ...n, transcription, isTranscribing: false } : n,
        );
        onNotesChange(updated);
        return updated;
      });
    },
    [onNotesChange],
  );

  const transcribeAudio = React.useCallback(
    (noteId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      const SpeechRecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) {
        updateNoteTranscription(noteId, "(Speech recognition not supported in this browser)");
        return;
      }

      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      const note = notes.find((n) => n.id === noteId);
      if (!note?.objectUrl) {
        updateNoteTranscription(noteId, "(No audio available for transcription)");
        return;
      }

      const audio = new Audio(note.objectUrl);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const results = event.results as { [index: number]: { [index: number]: { transcript: string } }; length: number };
        let transcript = "";
        for (let i = 0; i < results.length; i++) {
          transcript += results[i][0].transcript + " ";
        }
        updateNoteTranscription(noteId, transcript.trim() || "(No speech detected)");
      };

      recognition.onerror = () => {
        updateNoteTranscription(noteId, "(Transcription failed — try a shorter recording)");
      };

      recognition.start();
      audio.play();

      audio.onended = () => {
        recognition.stop();
      };
    },
    [notes, updateNoteTranscription],
  );

  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const deleteNote = React.useCallback(
    (id: string) => {
      setNotes((prev) => {
        const note = prev.find((n) => n.id === id);
        if (note?.objectUrl) URL.revokeObjectURL(note.objectUrl);
        const updated = prev.filter((n) => n.id !== id);
        onNotesChange(updated);
        return updated;
      });
      audioRefs.current.delete(id);
    },
    [onNotesChange],
  );

  const togglePlayback = React.useCallback(
    (id: string) => {
      const audio = audioRefs.current.get(id);
      if (!audio) return;
      if (playingId === id) {
        audio.pause();
        setPlayingId(null);
      } else {
        audioRefs.current.forEach((a, key) => { if (key !== id) a.pause(); });
        audio.play();
        setPlayingId(id);
      }
    },
    [playingId],
  );

  return (
    <div className={className}>
      <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-border p-8">
        <Button
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className="h-16 w-16 rounded-full"
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        {isRecording ? (
          <div className="mt-4 text-center">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
              <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Recording...</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Click to start recording audio notes
          </p>
        )}
      </div>

      {notes.length > 0 && (
        <ul className="mt-4 space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
              <Button variant="ghost" size="icon" onClick={() => togglePlayback(note.id)}>
                {playingId === note.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              {note.objectUrl && (
                <audio
                  ref={(el) => { if (el) audioRefs.current.set(note.id, el); }}
                  src={note.objectUrl}
                  onEnded={() => setPlayingId(null)}
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Audio Note</p>
                {note.isTranscribing ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Transcribing...</span>
                  </div>
                ) : note.transcription ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {note.transcription}
                  </p>
                ) : null}
              </div>

              <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
