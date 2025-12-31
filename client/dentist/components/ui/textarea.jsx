export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`flex min-h-[100px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors ${className}`}
      {...props}
    />
  );
}