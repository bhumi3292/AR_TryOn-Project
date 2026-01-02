import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black text-[var(--gold)] p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">AR component failed to load</h2>
            <p className="text-sm text-[var(--gold-dim)]">Try reloading the page or check your camera permissions.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
