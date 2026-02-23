import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Seite nicht gefunden — Decivio</title>
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-6xl font-display font-bold text-foreground mb-2">404</h1>
          <p className="text-lg text-muted-foreground mb-2">Seite nicht gefunden</p>
          <p className="text-sm text-muted-foreground/70 mb-8">
            Die Seite <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{location.pathname}</code> existiert nicht oder wurde verschoben.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/dashboard"><Home className="w-4 h-4 mr-2" /> Zum Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Startseite</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default NotFound;
