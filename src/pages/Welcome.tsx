import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const Welcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#060D1A] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white">Willkommen</h1>
        <p className="text-white/60 mt-2">Der Onboarding-Wizard wird im nächsten Schritt gebaut.</p>
      </motion.div>
    </div>
  );
};

export default Welcome;
