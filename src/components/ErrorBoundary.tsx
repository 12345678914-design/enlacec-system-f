import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };


  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-center space-y-3 max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-rose-800 dark:text-rose-200">
              {this.props.fallbackTitle || 'Ocurrió un error al cargar esta sección'}
            </h3>
            <p className="text-xs text-rose-600/80 dark:text-rose-300/80 mt-1 font-mono break-words">
              {this.state.error?.message || 'Error inesperado de ejecución'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar y Recargar Sección
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
