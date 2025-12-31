export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return (
    <div className={`mb-4 flex flex-col space-y-1.5 ${className}`} {...props} />
  );
}

export function CardTitle({ className = "", ...props }) {
  return (
    <h3
      className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}
      {...props}
    />
  );
}

export function CardDescription({ className = "", ...props }) {
  return (
    <p
      className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}
      {...props}
    />
  );
}