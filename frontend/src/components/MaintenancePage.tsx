export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-4" role="img" aria-label="maintenance">🔧</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          System Under Maintenance
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Spill is temporarily unavailable for scheduled maintenance.
          Your data remains safe and encrypted. Please try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-spill-600 text-white rounded-lg hover:bg-spill-700 transition-colors focus:outline-none focus:ring-2 focus:ring-spill-500 focus:ring-offset-2"
        >
          Retry
        </button>
        <p className="text-xs text-gray-400 mt-4">
          If this persists, contact your IT administrator.
        </p>
      </div>
    </div>
  );
}
