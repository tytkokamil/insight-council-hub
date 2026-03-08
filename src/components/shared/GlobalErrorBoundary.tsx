import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import * as Sentry from "@sentry/react";
import i18n from "@/i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[GlobalErrorBoundary] Unhandled error:", error);
    console.error("[GlobalErrorBoundary] Component stack:", info.componentStack);
    this.setState({ errorInfo: info.componentStack || null });
    Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack || "" } } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const t = (key: string) => i18n.t(key);

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6" role="alert" aria-live="assertive">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">{t("shared.errorTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("shared.errorDesc")}</p>
          </div>

          {this.state.error && (
            <div className="bg-muted/50 border border-border/60 rounded-lg p-3 text-left">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t("shared.errorRetry")}
            </button>
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/60 bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Home className="w-4 h-4" />
              {t("shared.errorHome")}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground/50">
            {t("shared.errorId")}: {Date.now().toString(36).toUpperCase()}
          </p>
        </div>
      </div>
    );
  }
}

export default GlobalErrorBoundary;
