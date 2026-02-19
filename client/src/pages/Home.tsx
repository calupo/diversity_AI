import { useRef, useState } from "react";
import { useVoiceRecorder } from "@/replit_integrations/audio/useVoiceRecorder";
import { useTranslate } from "@/hooks/use-translations";
import { TranslationCard } from "@/components/TranslationCard";
import { RecentHistory } from "@/components/RecentHistory";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { Mic, MicOff, Settings, Volume2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  const { state: recordingState, startRecording, stopRecording } = useVoiceRecorder();
  const { mutate: translate, isPending } = useTranslate();
  const { toast } = useToast();
  
  const [result, setResult] = useState<{
    original: string;
    berlin: string;
    english: string;
    berlinAudio?: string;
    englishAudio?: string;
  } | null>(null);
  
  const [autoPlay, setAutoPlay] = useState(true);
  const autoPlayAudioRef = useRef<HTMLAudioElement | null>(null);

  const playAudioSequentially = async (audioClips: Array<string | undefined>) => {
    const clips = audioClips.filter((clip): clip is string => Boolean(clip));
    if (!clips.length) return;

    const audio = autoPlayAudioRef.current ?? new Audio();
    autoPlayAudioRef.current = audio;

    for (const clip of clips) {
      await new Promise<void>((resolve) => {
        audio.src = `data:audio/mp3;base64,${clip}`;
        audio.currentTime = 0;

        const cleanup = () => {
          audio.onended = null;
          audio.onerror = null;
        };

        audio.onended = () => {
          cleanup();
          resolve();
        };

        audio.onerror = () => {
          cleanup();
          resolve();
        };

        audio.play().catch(() => {
          cleanup();
          resolve();
        });
      });
    }
  };

  const handleMicClick = async () => {
    if (recordingState === "idle" || recordingState === "stopped") {
      try {
        await startRecording();
        setResult(null); // Clear previous result
      } catch (err) {
        toast({
          title: "Microphone Error",
          description: "Could not access microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    } else if (recordingState === "recording") {
      const blob = await stopRecording();
      processAudio(blob);
    }
  };

  const processAudio = (blob: Blob) => {
    // 1. Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64Audio = reader.result?.toString().split(',')[1];
      if (!base64Audio) return;

      // 2. Send to backend
      translate(
        { audio: base64Audio, autoPlay },
        {
          onSuccess: (data) => {
            setResult(data);
            
            // Handle Auto-play if enabled (German first, then English)
            if (autoPlay) {
              void playAudioSequentially([data.berlinAudio, data.englishAudio]);
            }
          },
          onError: (error) => {
            toast({
              title: "Translation Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      );
    };
  };

  return (
    <div className="min-h-screen pb-20 bg-[#F8F9FA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-xl border-2 border-black">
              💛
            </div>
            <div>
              <h1 className="text-lg leading-none font-bold text-black">Lingo</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Driver Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full border border-black/5">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium hidden sm:inline-block">Auto-play</span>
              <Switch 
                checked={autoPlay} 
                onCheckedChange={setAutoPlay} 
                className="scale-75 data-[state=checked]:bg-primary data-[state=checked]:border-black"
              />
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                  <Info className="w-5 h-5 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Speak clearly for best results</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 md:pt-12 flex flex-col items-center">
        {/* Main Mic Button Area */}
        <div className="relative mb-12 mt-4">
          <AudioVisualizer isRecording={recordingState === "recording"} />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMicClick}
            disabled={isPending}
            className={`
              relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center
              shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 transition-all duration-300
              ${recordingState === "recording" 
                ? "bg-red-500 border-red-600 text-white pulse-ring" 
                : "bg-primary border-black text-black hover:shadow-[0_8px_40px_rgba(240,215,34,0.4)]"
              }
              ${isPending ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isPending ? (
              <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin" />
            ) : recordingState === "recording" ? (
              <MicOff className="w-10 h-10 md:w-12 md:h-12" />
            ) : (
              <Mic className="w-10 h-10 md:w-12 md:h-12" />
            )}
          </motion.button>

          {/* Helper Text */}
          <motion.p 
            key={recordingState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-6 text-center whitespace-nowrap font-medium text-muted-foreground"
          >
            {isPending 
              ? "Translating..." 
              : recordingState === "recording" 
                ? "Tap to stop" 
                : "Tap to speak"
            }
          </motion.p>
        </div>

        {/* Results Grid */}
        <div className="w-full grid gap-6 md:grid-cols-2 max-w-4xl">
          <TranslationCard
            title="Berliner Schnauze"
            text={result?.berlin || ""}
            audioBase64={result?.berlinAudio}
            variant="berlin"
            isLoading={isPending}
          />
          
          <TranslationCard
            title="British English"
            text={result?.english || ""}
            audioBase64={result?.englishAudio}
            variant="english"
            isLoading={isPending}
          />
        </div>

        {/* Original Text (Subtle) */}
        {result?.original && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-muted-foreground">Original: "{result.original}"</p>
          </motion.div>
        )}

        {/* History Section */}
        <RecentHistory />
      </main>
    </div>
  );
}
