"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-page">
      {/* Navigation */}
      <header className="container mx-auto flex items-center justify-between py-6">
        <div className="flex items-center gap-2 font-bold text-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6 text-primary"
          >
            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
          </svg>
          Budget Tracker
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle iconOnly />
          <Button asChild variant="ghost" className="font-medium">
            <Link href="/auth/login">Log in</Link>
          </Button>
          <Button asChild className="font-medium">
            <Link href="/auth/register">Sign up free</Link>
          </Button>
        </div>
      </header>

      {/* Hero section */}
      <div className="container mx-auto flex flex-col items-center px-4 py-16 md:py-24">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Take control of your <span className="text-gradient-primary">finances</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Track expenses, set budgets, and gain insights into your spending habits with our powerful and easy-to-use budget tracking tool.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="text-base font-semibold px-8 py-6">
              <Link href="/auth/register">Get Started — It's Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base font-semibold px-8 py-6">
              <Link href="/auth/login">Log in to Your Account</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight mb-16">
          Everything you need to <span className="text-gradient-purple">manage your money</span>
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 rounded-xl border bg-gradient-card p-8 text-left shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="rounded-2xl bg-gradient-primary text-white p-8 md:p-12 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-6">
            Ready to start saving?
          </h2>
          <p className="mb-8 max-w-2xl">
            Join thousands of people who use Budget Tracker to take control of their finances and achieve their financial goals.
          </p>
          <Button asChild size="lg" className="px-8 py-6 text-base font-semibold bg-white text-primary hover:bg-white/90">
            <Link href="/auth/register">Create Your Free Account</Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Budget Tracker. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    title: "Track Expenses",
    description: "Easily record and categorize all your expenses and income in one place.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v12m-8-6h16"
        />
      </svg>
    ),
  },
  {
    title: "Set Budgets",
    description: "Create custom budgets for different categories and track your progress.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    title: "Analyze Trends",
    description: "Visualize your spending patterns with intuitive charts and reports.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
        />
      </svg>
    ),
  },
]; 