"use client";

import { useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";


const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function BookPage() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service_id: "",
    preferred_date: "",
    time_slot: "",
    notes: "",
  });

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch(`${API_BASE}/api/services?active=true`);
        if (!res.ok) throw new Error("Failed to load services");
        const data = await res.json();
        setServices(data.services ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const canGoNextStep1 =
    form.name.trim() && form.email.trim() && form.phone.trim();
  const canGoNextStep2 =
    form.service_id && form.preferred_date && form.preferred_date.length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/public/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit booking");
      }
      setSuccess(
        "Your appointment request has been submitted. We will confirm your exact time by email."
      );
      setForm({
        name: "",
        email: "",
        phone: "",
        service_id: "",
        preferred_date: "",
        time_slot: "",
        notes: "",
      });
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-10 md:py-16">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Book an appointment
        </h1>
        <p className="text-sm text-black dark:text-zinc-400">
          Fill out the form below and we&apos;ll confirm your appointment time
          by email or phone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="mb-6 flex items-center gap-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full ${
              step === 1
                ? "bg-sky-600 text-white"
                : "bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            1
          </span>
          <span>Patient details</span>
          <span className="h-px flex-1 bg-white dark:bg-zinc-800" />
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full ${
              step === 2
                ? "bg-sky-600 text-white"
                : "bg-white text-white dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            2
          </span>
          <span>Service & date</span>
          <span className="h-px flex-1 bg-white dark:bg-zinc-800" />
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full ${
              step === 3
                ? "bg-sky-600 text-white"
                : "bg-white text-white dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            3
          </span>
          <span>Review</span>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-white px-3 py-2 text-xs text-white dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs text-whitedark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            {success}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                autoComplete="name"
                value={form.name}
                onChange={handleChange("name")}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="service">Service</Label>
              <select
                id="service"
                className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                value={form.service_id}
                onChange={handleChange("service_id")}
                disabled={loadingServices}
                required
              >
                <option value="">
                  {loadingServices ? "Loading services..." : "Select a service"}
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{" "}
                    {s.price ? `• ₹${s.price.toFixed ? s.price.toFixed(0) : s.price}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="date">Preferred date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.preferred_date}
                  onChange={handleChange("preferred_date")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Preferred time (optional)</Label>
                <Input
                  id="time"
                  placeholder="e.g. 10:30 AM"
                  value={form.time_slot}
                  onChange={handleChange("time_slot")}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <textarea
                id="notes"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                rows={3}
                value={form.notes}
                onChange={handleChange("notes")}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
            <div>
              <div className="font-semibold">Patient</div>
              <div>{form.name}</div>
              <div className="text-xs text-zinc-500">{form.email}</div>
              <div className="text-xs text-zinc-500">{form.phone}</div>
            </div>
            <div>
              <div className="font-semibold">Appointment</div>
              <div>
                {services.find((s) => String(s.id) === String(form.service_id))
                  ?.name || "Service"}
              </div>
              <div>
                {form.preferred_date}{" "}
                {form.time_slot && `• ${form.time_slot}`}
              </div>
            </div>
            {form.notes && (
              <div>
                <div className="font-semibold">Notes</div>
                <div className="text-xs text-zinc-500">{form.notes}</div>
              </div>
            )}
            <p className="text-xs text-zinc-500">
              By submitting, you agree to be contacted by our team to confirm
              your appointment time and discuss any additional treatment
              details.
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              disabled={(step === 1 && !canGoNextStep1) || (step === 2 && !canGoNextStep2)}
              onClick={() => setStep((s) => Math.min(3, s + 1))}
            >
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit request"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}


