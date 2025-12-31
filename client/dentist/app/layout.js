"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function Navigation() {
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = window?.localStorage?.getItem("token");
    const userData = window?.localStorage?.getItem("user");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error("Error parsing user data:", err);
        window?.localStorage?.removeItem("token");
        window?.localStorage?.removeItem("user");
      }
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    window?.localStorage?.removeItem("token");
    window?.localStorage?.removeItem("user");
    setUser(null);
    setShowUserMenu(false);
    router.push("/login");
  };

  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/verify-email");

  if (isAuthPage) return null;

  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
              B
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900">
                BrightSmile
              </span>
              <span className="text-xs text-gray-500">
                Dental Clinic
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/book"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Book Appointment
            </Link>
            {user && isAdmin && (
              <Link
                href="/admin/dashboard"
                className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user.name}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                    <div className="p-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.email}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 capitalize">
                        {user.role}
                      </span>
                    </div>
                    <div className="py-1">
                      {isAdmin && (
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-purple-600 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        href="/profile-setting"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1">{children}</main>
            <footer className="border-t bg-white py-8">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                      B
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        BrightSmile Dental
                      </p>
                      <p className="text-xs text-gray-500">
                        Quality dental care
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    © {new Date().getFullYear()} BrightSmile Dental Clinic. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}