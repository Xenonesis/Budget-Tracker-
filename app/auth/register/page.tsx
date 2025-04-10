"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useUserPreferences } from "@/lib/store";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserPlus, ChevronLeft, AlertCircle, Info, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { resetPreferences } = useUserPreferences();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // Reset preferences for a clean state
      resetPreferences();
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            preferred_currency: 'USD',
          },
          emailRedirectTo: `${window.location.origin}/auth/login`
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            name: name,
            currency: 'USD'
          });
          
        if (profileError && profileError.code !== '23505') {
          console.error("Error creating profile:", profileError);
        }
      }

      router.push("/auth/login?message=Check your email to confirm your account");
    } catch (error: any) {
      setError(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return 0;
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 25;
    else if (password.length >= 6) score += 15;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 25; // Has uppercase
    if (/[0-9]/.test(password)) score += 25; // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 25; // Has special char
    
    return Math.min(100, score);
  };

  const getStrengthText = () => {
    const strength = passwordStrength();
    if (strength >= 80) return "Strong";
    if (strength >= 50) return "Good";
    if (strength >= 30) return "Fair";
    if (strength > 0) return "Weak";
    return "";
  };

  const getStrengthColor = () => {
    const strength = passwordStrength();
    if (strength >= 80) return "bg-green-500";
    if (strength >= 50) return "bg-amber-500";
    if (strength >= 30) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Background gradient elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          className="absolute -top-[10%] right-[20%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl opacity-60"
          animate={{ 
            x: [0, 10, 0], 
            y: [0, 15, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        <motion.div 
          className="absolute -bottom-[20%] left-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-3xl opacity-60"
          animate={{ 
            x: [0, -10, 0], 
            y: [0, -15, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 10, 
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

        <div className="bg-background/80 backdrop-blur-lg rounded-2xl border shadow-lg p-8">
          <motion.div 
            className="space-y-3 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <motion.div
              className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2, 
                duration: 0.4, 
                type: "spring", 
                stiffness: 200 
              }}
            >
              <UserPlus size={24} />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
            <p className="text-muted-foreground text-sm">
              Join thousands of users managing their finances with Budget Tracker
            </p>
          </motion.div>

          {error && (
            <motion.div 
              className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm border border-destructive/20 flex items-center gap-2 text-destructive"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.form 
            onSubmit={handleRegister} 
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
                htmlFor="name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <motion.div 
                  className="absolute bottom-0 left-0 h-[2px] bg-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: name ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
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
                />
                <motion.div 
                  className="absolute bottom-0 left-0 h-[2px] bg-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: email ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <motion.div 
                  className="absolute bottom-0 left-0 h-[2px] bg-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: password ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-muted-foreground">Password strength</div>
                    <div className={`text-xs font-medium ${passwordStrength() >= 80 ? 'text-green-600' : passwordStrength() >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {getStrengthText()}
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${getStrengthColor()}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength()}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex gap-2 items-center mt-3 text-xs text-muted-foreground">
                    <Info size={12} />
                    <span>Password should be at least 6 characters long. Include numbers and special characters for stronger security.</span>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.3 }}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="mt-8"
            >
              <Button 
                type="submit" 
                className="w-full h-11 relative overflow-hidden group"
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  {loading ? "Creating account..." : "Create Account"}
                </span>
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

            <motion.div 
              className="rounded-lg bg-primary/5 p-4 border border-primary/10 flex gap-2 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Get Started in Minutes</p>
                <p className="text-muted-foreground text-xs mt-1">
                  After creating your account, you'll get immediate access to all features. 
                  Set up your first budget in just a few clicks.
                </p>
              </div>
            </motion.div>
          </motion.form>

          <motion.div 
            className="text-center text-sm mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline font-medium"
            >
              Sign in
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}