import { motion, useScroll } from "framer-motion";

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      style={{ scaleX: scrollYProgress, transformOrigin: "0%", background: 'hsl(220 45% 55%)' }}
      className="fixed top-0 left-0 right-0 h-[2px] z-[60]"
    />
  );
};

export default ScrollProgress;
