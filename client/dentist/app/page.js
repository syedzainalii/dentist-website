"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");
        
        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
        
        const res = await fetch(`${baseUrl}/api/services?active=true`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Fetched services:", data); // Debug log
        
        if (data.success && data.services) {
          setServices(data.services);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to load services");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
                <span className="text-sm font-medium text-blue-700">
                  Modern Dental Care • Patient First
                </span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Your smile deserves the{" "}
                <span className="text-blue-600">best care</span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Experience gentle, comprehensive dental care in a modern,
                comfortable environment. From routine checkups to advanced
                treatments, we're here for your smile.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="/book"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Book Appointment
                  <svg
                    className="ml-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Services
                </a>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-1">
                  <div className="flex items-center text-blue-600">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">
                      Mon - Sat
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 pl-7">
                    9:00 AM - 8:00 PM
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-blue-600">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">
                      Emergency
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 pl-7">
                    Same-day slots
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Feature Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Why Choose Us
                  </h3>
                </div>

                <p className="text-gray-600 leading-relaxed">
                  Our experienced team combines cutting-edge technology with
                  gentle care. We focus on prevention and education for
                  long-term dental health.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                      text: "Digital X-rays & Advanced Imaging",
                    },
                    {
                      icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
                      text: "Gentle, Pain-Free Procedures",
                    },
                    {
                      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                      text: "Transparent Pricing & Plans",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <svg
                        className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={item.icon}
                        />
                      </svg>
                      <span className="text-sm text-gray-700">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our Services
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Comprehensive dental care with transparent pricing. Each service
              is designed with your comfort in mind.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading services...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-sm text-red-700 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No services available
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Services will be displayed here once configured in the admin
                    dashboard.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Price
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{service.price?.toFixed ? service.price.toFixed(0) : service.price}
                        </p>
                      </div>
                      {service.duration_minutes && (
                        <div className="flex items-center space-x-1 rounded-lg bg-gray-100 px-3 py-1.5">
                          <svg
                            className="h-4 w-4 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-xs font-medium text-gray-700">
                            {service.duration_minutes}m
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && services.length > 0 && (
            <div className="mt-12 text-center">
              <a
                href="/book"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Schedule Your Visit
                <svg
                  className="ml-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">10+</div>
              <div className="mt-2 text-sm text-blue-100">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">5000+</div>
              <div className="mt-2 text-sm text-blue-100">Happy Patients</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">4.9/5</div>
              <div className="mt-2 text-sm text-blue-100">Patient Rating</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}