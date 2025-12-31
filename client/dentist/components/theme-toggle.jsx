"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-full bg-transparent hover:bg-accent/50 transition-colors"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {/* MOON: Visible in Light mode (scale-100), hidden in Dark mode (scale-0) */}
      <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
      
      {/* SUN: Hidden in Light mode (scale-0), visible in Dark mode (scale-100) */}
      <Sun className="absolute h-[1.2rem] w-[1.2rem] -rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}