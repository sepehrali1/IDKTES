import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep details in the developer console; do not expose them to visitors.
    console.error("SSBLOX UI error", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-fallback" dir="rtl">
          <div className="error-fallback-card">
            <AlertTriangle size={30} />
            <h1>یه مشکلی پیش اومد</h1>
            <p>صفحه نتونست درست بارگذاری بشه. می‌تونی دوباره تلاش کنی.</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} /> بارگذاری دوباره
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
