export function Badge({ className = "", variant = "default", ...props }) {
  const variants = {
    default:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    success:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    warning:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    danger:
      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        variants[variant] ?? variants.default
      } ${className}`}
      {...props}
    />
  );
}