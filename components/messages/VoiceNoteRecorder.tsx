'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

type VoiceNoteRecorderProps = {
    disabled?: boolean;
    onRecorded: (file: File, durationMs: number) => void | Promise<void>;
    className?: string;
    accentColor?: string;
};

function pickMimeType() {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

export default function VoiceNoteRecorder({
    disabled,
    onRecorded,
    className = '',
    accentColor = '#E52323',
}: VoiceNoteRecorderProps) {
    const [recording, setRecording] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [error, setError] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startedAtRef = useRef(0);
    const timerRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    async function start() {
        setError('');
        if (disabled || recording) return;
        if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setError('Voice notes need a supported browser with microphone access.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mimeType = pickMimeType();
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);
            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const durationMs = Math.max(500, Date.now() - startedAtRef.current);
                const blobType = recorder.mimeType || mimeType || 'audio/webm';
                const ext = blobType.includes('mp4')
                    ? 'm4a'
                    : blobType.includes('ogg')
                      ? 'ogg'
                      : 'webm';
                const blob = new Blob(chunksRef.current, { type: blobType.split(';')[0] });
                const file = new File([blob], `voice-note-${Date.now()}.${ext}`, {
                    type: blob.type || 'audio/webm',
                });
                stream.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
                void onRecorded(file, durationMs);
            };
            mediaRecorderRef.current = recorder;
            startedAtRef.current = Date.now();
            setElapsedMs(0);
            recorder.start(250);
            setRecording(true);
            timerRef.current = window.setInterval(() => {
                setElapsedMs(Date.now() - startedAtRef.current);
            }, 200);
        } catch {
            setError('Microphone permission denied or unavailable.');
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }

    function stop() {
        if (!recording) return;
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
        }
        setRecording(false);
        mediaRecorderRef.current = null;
    }

    const seconds = Math.floor(elapsedMs / 1000);
    const label = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => (recording ? stop() : void start())}
                title={recording ? 'Stop and send voice note' : 'Record a voice note'}
                aria-label={recording ? 'Stop and send voice note' : 'Record a voice note'}
                aria-pressed={recording}
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-50 ${
                    recording
                        ? 'border-red-200 bg-red-50 text-[#DC2626]'
                        : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F8FAFC]'
                }`}
                style={recording ? undefined : undefined}
            >
                {recording ? (
                    <>
                        <Square className="h-3.5 w-3.5 fill-current" />
                        <span
                            className="absolute -top-1 -right-1 h-2.5 w-2.5 animate-pulse rounded-full"
                            style={{ backgroundColor: accentColor }}
                        />
                    </>
                ) : (
                    <Mic className="h-4 w-4" />
                )}
            </button>
            {recording ? (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111827] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {label}
                </span>
            ) : null}
            {error ? (
                <span className="absolute bottom-full left-0 mb-1 w-40 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-700">
                    {error}
                </span>
            ) : null}
        </div>
    );
}
