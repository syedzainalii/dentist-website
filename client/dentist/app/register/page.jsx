'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Register, 2: Verify Email
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
        // If error parsing, clear storage and stay on register page
        console.error('Error parsing user data:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }

    // Validate password length
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        // Move to verification step
        setTimeout(() => {
          setStep(2);
          setSuccess('');
        }, 1500);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Backend not reachable. Make sure Flask server is running on port 4000.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificationCode || verificationCode.length !== 6) {
      return setError('Please enter a valid 6-digit code');
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          code: verificationCode,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Save token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setSuccess('Email verified! Redirecting...');
        
        // Redirect based on role (new users are always 'user' role)
        const userRole = data.user.role;
        
        setTimeout(() => {
          if (userRole === 'admin' || userRole === 'moderator') {
            router.push('/dashboard');
          } else {
            router.push('/');  // Regular users go to home page
          }
        }, 1500);
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('New verification code sent to your email!');
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
        {step === 1 ? (
          // STEP 1: REGISTRATION FORM
          <form onSubmit={handleRegister}>
            <h2 className="text-3xl font-bold mb-2 text-center text-gray-800 dark:text-white">Create Account</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Join us today!</p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 mb-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-3 mb-4 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                disabled={loading}
              />

              <input
                type="email"
                placeholder="Email Address"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={loading}
              />

              <input
                type="password"
                placeholder="Password (min 6 characters)"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                disabled={loading}
              />

              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                disabled={loading}
              />
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
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Login
              </button>
            </p>
          </form>
        ) : (
          // STEP 2: EMAIL VERIFICATION FORM
          <form onSubmit={handleVerifyEmail}>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Verify Your Email</h2>
              <p className="text-gray-600 dark:text-gray-400">
                We've sent a 6-digit code to<br />
                <span className="font-semibold text-gray-800 dark:text-white">{form.email}</span>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 mb-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-3 mb-4 rounded-lg text-sm">
                {success}
              </div>
            )}

            <input
              type="text"
              placeholder="Enter 6-digit code"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              maxLength={6}
              required
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full mt-6 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold disabled:text-gray-400"
                >
                  Resend Code
                </button>
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setVerificationCode('');
                  setError('');
                  setSuccess('');
                }}
                className="mt-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-sm"
              >
                ← Back to Registration
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}