"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';


function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }
    async function load() {
      try {
        const authHeaders = {
          Authorization: `Bearer ${token}`,
        };
        const [summaryRes, chartsRes, bookingsRes, servicesRes] =
          await Promise.all([
            fetch(`${API_BASE}/api/dashboard/summary`, { headers: authHeaders }),
            fetch(`${API_BASE}/api/dashboard/charts?range=30d`, {
              headers: authHeaders,
            }),
            fetch(`${API_BASE}/api/bookings`, { headers: authHeaders }),
            fetch(`${API_BASE}/api/services?active=false`),
          ]);

        if (summaryRes.status === 401 || summaryRes.status === 403) {
          router.push("/admin/login");
          return;
        }

        const summaryData = await summaryRes.json();
        const chartsData = await chartsRes.json();
        const bookingsData = await bookingsRes.json();
        const servicesData = await servicesRes.json();

        if (!summaryData.success) throw new Error("Failed to load summary");
        setSummary(summaryData.summary);
        setCharts(chartsData.charts ?? null);
        setBookings(bookingsData.bookings ?? []);
        setServices(servicesData.services ?? []);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleStatusChange(id, status, time_slot) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, time_slot }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update booking");
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? data.booking : b))
      );
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCreateService(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newService,
          price: parseFloat(newService.price || "0"),
          duration_minutes: newService.duration_minutes
            ? parseInt(newService.duration_minutes, 10)
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create service");
      }
      setServices((prev) => [...prev, data.service]);
      setNewService({
        name: "",
        description: "",
        price: "",
        duration_minutes: "",
      });
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-sm text-zinc-500">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-sm text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Admin dashboard
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Overview of bookings, revenue and services.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.localStorage.removeItem("token");
            }
            router.push("/admin/login");
          }}
        >
          Sign out
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total bookings</CardTitle>
            <CardDescription>
              {summary?.bookings?.total ?? 0}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending</CardTitle>
            <CardDescription>
              {summary?.bookings?.pending ?? 0}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>
              {summary?.bookings?.completed ?? 0}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total revenue</CardTitle>
            <CardDescription>
              ₹{summary?.revenue?.total?.toFixed
                ? summary.revenue.total.toFixed(0)
                : summary?.revenue?.total ?? 0}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Bookings over time</CardTitle>
          </CardHeader>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.bookings_over_time ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by service</CardTitle>
          </CardHeader>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.revenue_by_service ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="service_name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent bookings</CardTitle>
            <CardDescription>
              Manage pending and confirmed appointments.
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Patient</th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-zinc-100 text-[11px] dark:border-zinc-800"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-zinc-900 dark:text-zinc-50">
                        {b.customer_name}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {b.customer_email}
                      </div>
                    </td>
                    <td className="px-3 py-2">{b.service_name}</td>
                    <td className="px-3 py-2">{b.preferred_date}</td>
                    <td className="px-3 py-2">
                      <Input
                        className="h-7 px-2 text-[11px]"
                        value={b.time_slot || ""}
                        onChange={(e) =>
                          setBookings((prev) =>
                            prev.map((row) =>
                              row.id === b.id
                                ? { ...row, time_slot: e.target.value }
                                : row
                            )
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="h-7 rounded-md border border-zinc-300 bg-white px-2 text-[11px] dark:border-zinc-700 dark:bg-zinc-900"
                        value={b.status}
                        onChange={(e) =>
                          setBookings((prev) =>
                            prev.map((row) =>
                              row.id === b.id
                                ? { ...row, status: e.target.value }
                                : row
                            )
                          )
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() =>
                          handleStatusChange(b.id, b.status, b.time_slot)
                        }
                      >
                        Save
                      </Button>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-xs text-zinc-500"
                    >
                      No bookings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>
              Add and manage services shown on the public site.
            </CardDescription>
          </CardHeader>
          <div className="space-y-3">
            <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
              {services.map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <span>{s.name}</span>
                  <span className="text-[11px] text-zinc-500">
                    ₹
                    {s.price?.toFixed ? s.price.toFixed(0) : s.price}
                  </span>
                </li>
              ))}
              {services.length === 0 && (
                <li className="text-xs text-zinc-500">
                  No services configured yet.
                </li>
              )}
            </ul>
            <form onSubmit={handleCreateService} className="space-y-2 pt-2">
              <Label className="text-xs">Add service</Label>
              <Input
                placeholder="Name"
                value={newService.name}
                onChange={(e) =>
                  setNewService((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
              <Input
                placeholder="Description (optional)"
                value={newService.description}
                onChange={(e) =>
                  setNewService((p) => ({ ...p, description: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Price (₹)"
                  type="number"
                  min="0"
                  value={newService.price}
                  onChange={(e) =>
                    setNewService((p) => ({ ...p, price: e.target.value }))
                  }
                  required
                />
                <Input
                  placeholder="Duration (min)"
                  type="number"
                  min="0"
                  value={newService.duration_minutes}
                  onChange={(e) =>
                    setNewService((p) => ({
                      ...p,
                      duration_minutes: e.target.value,
                    }))
                  }
                />
              </div>
              <Button type="submit" className="w-full text-xs">
                Add service
              </Button>
            </form>
          </div>
        </Card>
      </section>
    </div>
  );
}


