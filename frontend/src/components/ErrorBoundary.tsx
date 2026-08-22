/**
 * ErrorBoundary — Global error handler for unexpected React errors.
 *
 * WCAG 2.0 AA: Error message is announced to screen readers,
 * uses role="alert", and provides actionable recovery instructions.
 */

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
            <div className="text-4xl mb-4" aria-hidden="true">
              ⚠️
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              An unexpected error occurred. Your data remains safe — no
              information was sent to the server during this error.
            </p>
            <p className="text-sm text-gray-500 mb-6 font-mono bg-gray-50 rounded p-2 break-words">
              {this.state.error?.message || "Unknown error"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-5 py-2.5 bg-spill-600 text-white font-medium rounded-lg hover:bg-spill-700 transition-colors focus:outline-none focus:ring-2 focus:ring-spill-500 focus:ring-offset-2"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Reload Page
              </button>
            </div>
            <p className="mt-6 text-xs text-gray-400">
              Your privacy is preserved — this error was handled entirely in
              your browser.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
