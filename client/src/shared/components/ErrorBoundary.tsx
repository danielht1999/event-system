// client/src/shared/components/ErrorBoundary.tsx

import { Component} from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>Algo salió mal</h2>
            <p>{this.state.error?.message || 'Error inesperado'}</p>
            <button onClick={() => window.location.reload()}>
              Recargar página
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}