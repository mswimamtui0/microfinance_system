import React from 'react';
import { useTranslation } from 'react-i18next';

const ErrorBoundary = ({ children }) => {
  const { t } = useTranslation();

  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // You could log to an error reporting service here
    const handleError = (error) => {
      console.error('Error caught by boundary:', error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleReset = () => {
    setHasError(false);
    setError(null);
    window.location.reload();
  };

  if (hasError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('Something went wrong')}
          </h2>
          <p className="text-gray-500 mb-4">
            {error?.message || t('An unexpected error occurred')}
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('Refresh Page')}
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// Add componentDidCatch for class-like error handling
ErrorBoundary.getDerivedStateFromError = (error) => {
  return { hasError: true, error };
};

export default ErrorBoundary;