import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import i18n from "@/i18n";

interface Props {
  children: ReactNode;
  label?: string;
  compact?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[WidgetErrorBoundary${this.props.label ? ` – ${this.props.label}` : ""}]`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label, compact } = this.props;
    const t = (key: string, opts?: Record<string, string>) => i18n.t(key, opts);
    const failedMsg = t("shared.widgetLoadFailed", { label: label || "Widget" });
    const retryMsg = t("shared.widgetRetry");

    if (compact) {
      return (
        <Card className="border-destructive/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{failedMsg}</p>
              <p className="text-xs text-muted-foreground truncate">{this.state.error?.message}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={this.handleRetry} className="shrink-0 gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              {retryMsg}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold">{failedMsg}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">{this.state.error?.message}</p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleRetry} className="gap-1.5 mt-1">
            <RefreshCw className="w-3.5 h-3.5" />
            {retryMsg}
          </Button>
        </CardContent>
      </Card>
    );
  }
}

export default WidgetErrorBoundary;