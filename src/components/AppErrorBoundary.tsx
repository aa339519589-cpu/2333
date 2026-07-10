import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo): void { console.error("AetherGrid render failure", error, info.componentStack); }
  render(): ReactNode {
    if (this.state.error === null) return this.props.children;
    return <main className="fatal-state" role="alert"><AlertTriangle size={24} /><p className="eyebrow">CONTROL PLANE INTERRUPTED</p><h1>Unable to render this workspace</h1><p>{this.state.error.message}</p><button type="button" onClick={() => window.location.reload()}><RotateCcw size={15} />Reload workspace</button></main>;
  }
}
