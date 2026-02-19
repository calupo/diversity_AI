import { motion } from "framer-motion";

export function AudioVisualizer({ isRecording }: { isRecording: boolean }) {
  if (!isRecording) return null;

  return (
    <div className="flex items-center justify-center gap-1 h-8 absolute bottom-full mb-4 left-1/2 -translate-x-1/2">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-primary rounded-full"
          animate={{
            height: ["8px", "24px", "8px"],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
