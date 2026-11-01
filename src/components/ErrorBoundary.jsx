import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 ErrorBoundary capturó un fallo de renderizado:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] p-6 text-center text-[#2c2c2c]">
          <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-[#e8e2d9] space-y-4">
            <span className="text-4xl">📖</span>
            <h2 className="text-xl font-serif font-bold text-[#1a1a1a]">
              Algo no salió como esperábamos
            </h2>
            <p className="text-xs text-[#666666] leading-relaxed">
              Ocurrió un pequeño inconveniente técnico al renderizar esta vista. No te preocupes, tus datos y progresos de lectura están a salvo.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#333333] text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              Recargar la aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
