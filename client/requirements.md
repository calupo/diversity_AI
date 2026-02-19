## Packages
framer-motion | Smooth animations for recording state and result cards
clsx | Conditional class merging
tailwind-merge | Tailwind class merging utility

## Notes
Audio recording uses MediaRecorder API via @/replit_integrations/audio/useVoiceRecorder
Audio playback handles base64 strings from API response
Backend expects POST /api/translate with { audio: base64, autoPlay: boolean }
Theme uses BVG Yellow (#F0D722) as primary brand color
