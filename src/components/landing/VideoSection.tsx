import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import teaserVideo from "@/assets/decisionos-teaser-video.mp4";

const VideoSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play();
    setPlaying(!playing);
  };

  return (
    <section className="py-6 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="relative rounded-2xl border border-border/40 overflow-hidden group cursor-pointer bg-card shadow-elevated"
            onClick={togglePlay}
          >
            <video
              ref={videoRef}
              src={teaserVideo}
              autoPlay
              muted
              loop
              playsInline
              className="w-full aspect-video object-cover"
            />
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-foreground/[0.06] ${
                playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                {playing ? (
                  <Pause className="w-5 h-5 text-foreground" />
                ) : (
                  <Play className="w-5 h-5 text-foreground ml-0.5" />
                )}
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-3">
            30-Sekunden-Überblick: So funktioniert Decivio
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;
