'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Redirect based on role
        if (parsedUser.role === 'admin' || parsedUser.role === 'moderator') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      } catch (err) {
        // If error parsing, clear storage and stay on login page
        console.error('Error parsing user data:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      return setError('Please fill in all fields');
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Save token and user data to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Debug logs
        console.log('Login successful!');
        console.log('User data:', data.user);
        console.log('User role:', data.user.role);
        
        // Redirect based on role
        const userRole = data.user.role;
        
        console.log('Redirecting based on role:', userRole);
        
        if (userRole === 'admin' || userRole === 'moderator') {
          // Admin and Moderator go to dashboard
          console.log('Redirecting to dashboard...');
          router.push('/dashboard');
        } else {
          // Regular users go to home page
          console.log('Redirecting to home page...');
          router.push('/');
        }
      } else {
        // Handle specific error cases
        if (res.status === 403 && !data.email_verified) {
          setError('Please verify your email before logging in');
          // Optionally redirect to verification page
          setTimeout(() => {
            router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
          }, 2000);
        } else {
          setError(data.message || 'Login failed');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Backend not reachable. Make sure Flask server is running on port 4000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Welcome Back</h2>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 mb-6 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}