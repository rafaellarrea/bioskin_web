import React from 'react';

interface State { hasError: boolean; error: Error | null }

class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error('Error capturado por ErrorBoundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h2>¡Ups! Algo falló al renderizar.</h2>
          <pre>{this.state.error?.message}</pre>
          <p>Mira la consola para más detalles.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
