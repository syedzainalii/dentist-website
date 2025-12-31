"use client";

export function Button({ className = "", variant = "default", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 px-6";
  
  const variants = {
    default:
      "bg-blue-600 text-gray-700 hover:bg-blue-700 focus-visible:ring-blue-500",
    outline:
      "border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-black dark:text-gray-200",
    ghost:
      "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-gray-200",
    destructive:
      "bg-red-600 text-gray-700 hover:bg-red-700 focus-visible:ring-red-500",
  };

  return (
    <button
      className={`${base} ${variants[variant] ?? variants.default} ${className}`}
      {...props}
    />
  );
}