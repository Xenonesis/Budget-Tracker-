"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useUserPreferences } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, LogIn, ChevronLeft, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTouched, setFormTouched] = useState({
    email: false,
    password: false
  });
  const { resetPreferences } = useUserPreferences();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsSubmitting(true);
    setError(null);

    try {
      // Reset preferences to ensure a clean state
      resetPreferences();
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldFocus = (field: 'email' | 'password') => {
    setFormTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Background gradient elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl opacity-60"
          animate={{ 
            x: [0, 10, 0], 
            y: [0, 15, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        <motion.div 
          className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl opacity-60"
          animate={{ 
            x: [0, -10, 0], 
            y: [0, -15, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        <Link 
          href="/" 
          className="absolute -top-12 left-0 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to home
        </Link>

        <div className="bg-background/80 backdrop-blur-lg rounded-2xl border shadow-lg p-8 relative overflow-hidden">
          {/* Subtle background animation */}
          <div className="absolute inset-0 -z-10">
            <motion.div 
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent rounded-2xl"
              animate={{ 
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{ 
                duration: 15, 
                repeat: Infinity,
                repeatType: "mirror" 
              }}
              style={{
                backgroundSize: '200% 200%'
              }}
            />
          </div>

          <motion.div 
            className="space-y-3 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <motion.div
              className="mx-auto w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2, 
                duration: 0.4, 
                type: "spring", 
                stiffness: 200 
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="w-9 h-9 relative"
              >
                <Image 
                  src="/logo.svg" 
                  alt="Budget Buddy Logo" 
                  width={36} 
                  height={36} 
                  className="h-9 w-9" 
                  priority
                />
              </motion.div>
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-primary/30"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: [0.8, 1.2, 1] }}
                transition={{ delay: 0.5, duration: 0.6 }}
              />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to sign in to your account
            </p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm border border-destructive/20 flex items-center gap-2 text-destructive"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form 
            onSubmit={handleLogin} 
            className="space-y-5 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => handleFieldFocus('email')}
                />
                <motion.div 
                  className="absolute bottom-0 left-0 h-[2px] bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: formTouched.email ? (email ? "100%" : "0%") : "0%" }}
                  transition={{ duration: 0.3 }}
                />
                {email.length > 0 && (
                  <motion.div
                    className="absolute right-3 top-3 h-5 w-5 flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Password
                </label>
                <Link
                  href="/auth/reset-password"
                  className="text-xs text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                >
                  <motion.span 
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    Forgot password?
                  </motion.span>
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => handleFieldFocus('password')}
                />
                <motion.button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </motion.button>
                <motion.div 
                  className="absolute bottom-0 left-0 h-[2px] bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: formTouched.password ? (password ? "100%" : "0%") : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              <Button 
                type="submit" 
                className="w-full h-11 relative overflow-hidden group"
                disabled={loading}
              >
                <motion.span 
                  className="relative z-10 flex items-center justify-center gap-2"
                  animate={isSubmitting ? { y: [0, -30] } : { y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <LogIn className="h-4 w-4" />
                  {loading ? "Signing in..." : "Sign In"}
                </motion.span>
                {isSubmitting && (
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ y: 30 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </motion.div>
                )}
                <motion.div 
                  className="absolute inset-0 bg-primary-gradient"
                  animate={{ 
                    x: loading ? "0%" : ["0%", "100%"],
                  }}
                  transition={{ 
                    duration: loading ? 0 : 2, 
                    repeat: loading ? 0 : Infinity,
                    repeatType: "reverse"
                  }}
                />
              </Button>
            </motion.div>
          </motion.form>

          <motion.div 
            className="text-center text-sm mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <motion.span 
                whileHover={{ x: 3 }}
                transition={{ duration: 0.2 }}
                className="inline-block"
              >
                Sign up
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 