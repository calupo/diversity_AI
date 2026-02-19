import { Volume2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TranslationCardProps {
  title: string;
  text: string;
  audioBase64?: string;
  variant?: "berlin" | "english" | "default";
  isLoading?: boolean;
}

export function TranslationCard({ 
  title, 
  text, 
  audioBase64, 
  variant = "default",
  isLoading = false 
}: TranslationCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handlePlayAudio = () => {
    if (!audioBase64 || isPlaying) return;
    
    setIsPlaying(true);
    const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
    audio.onended = () => setIsPlaying(false);
    audio.play().catch(() => setIsPlaying(false));
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "berlin":
        return "bg-black text-white border-black";
      case "english":
        return "bg-white text-black border-black/10";
      default:
        return "bg-white text-black border-border";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl p-6 shadow-lg relative overflow-hidden transition-all duration-300",
        getVariantStyles(),
        "border-2"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className={cn(
          "text-xs font-bold uppercase tracking-wider opacity-70",
          variant === "berlin" ? "text-primary" : "text-muted-foreground"
        )}>
          {title}
        </h3>
        
        <div className="flex gap-2">
          {audioBase64 && (
            <button
              onClick={handlePlayAudio}
              disabled={isPlaying || isLoading}
              className={cn(
                "p-2 rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50",
                isPlaying ? "bg-primary text-black" : (variant === "berlin" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-black")
              )}
            >
              <Volume2 className={cn("w-4 h-4", isPlaying && "animate-pulse")} />
            </button>
          )}
          
          <button
            onClick={handleCopy}
            className={cn(
              "p-2 rounded-full transition-all hover:scale-105 active:scale-95",
              variant === "berlin" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-black"
            )}
          >
            {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="min-h-[3rem] relative">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 rounded-full bg-current animate-bounce"></span>
            </motion.div>
          ) : (
            <motion.p
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "text-lg sm:text-xl font-medium leading-relaxed font-sans",
                !text && "opacity-50 italic"
              )}
            >
              {text || "Waiting for input..."}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {variant === "berlin" && (
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
      )}
    </motion.div>
  );
}
