"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { motion, useScroll, useTransform, useInView, useAnimation, AnimatePresence } from "framer-motion";
import { 
  PieChart, 
  LineChart, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  Menu, 
  X, 
  ChevronRight, 
  Star, 
  Check,
  Sparkles,
  MousePointer,
  CreditCard,
  BarChart,
  Bell,
  Lock,
  CheckCircle,
  BadgeDollarSign,
  Users,
  Building,
  Lightbulb,
  Heart,
  Clock,
  Gift,
  BarChart2,
  ChevronDown,
  FileText,
  Settings,
  UserPlus
} from "lucide-react";
import { HeroBubbles, FeatureBubbles, TestimonialBubbles, CTABubbles } from "./page-animations";

// Parallax wrapper component
const ParallaxWrapper: React.FC<{ children: React.ReactNode; speed?: number }> = ({ children, speed = 0.05 }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  
  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className="relative z-10"
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.98]);
  const headerBlur = useTransform(scrollY, [0, 50], ['0px', '8px']);
  const headerY = useTransform(scrollY, [0, 150], [0, -5]);
  const headerScale = useTransform(scrollY, [0, 150], [1, 0.98]);
  const heroRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  // Add this hidden Netlify form for compatibility with version 5 of @netlify/plugin-nextjs
  // Hidden form is pre-rendered at build time for Netlify to detect
  const hiddenForm = (
    <form name="contact" data-netlify="true" hidden>
      <input type="text" name="name" />
      <input type="email" name="email" />
      <textarea name="message"></textarea>
    </form>
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth) - 0.5;
      const y = (clientY / window.innerHeight) - 0.5;
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Scroll to section smoothly
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <main className="flex flex-col w-full min-h-screen overflow-x-hidden">
      {/* Hidden Netlify form - simplified version */}
      <form name="contact" data-netlify="true" hidden>
        <input type="text" name="name" />
        <input type="email" name="email" />
        <textarea name="message"></textarea>
      </form>
      
      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 bg-background/0"
        style={{ 
          backdropFilter: useTransform(scrollY, [0, 50], ['0px', '8px']),
          WebkitBackdropFilter: useTransform(scrollY, [0, 50], ['0px', '8px']),
          backgroundColor: useTransform(scrollY, [0, 50], ['rgba(var(--background-rgb), 0)', 'rgba(var(--background-rgb), 0.6)']),
          boxShadow: useTransform(scrollY, [0, 50], ['none', '0 10px 30px rgba(0,0,0,0.08)']),
          borderBottom: useTransform(scrollY, [0, 50], ['none', '1px solid rgba(255,255,255,0.1)']),
          y: useTransform(scrollY, [0, 150], [0, -5]),
          scale: useTransform(scrollY, [0, 150], [1, 0.98])
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4 relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-2xl flex items-center gap-2 max-w-[60%] md:max-w-full"
              onHoverStart={() => setIsLogoHovered(true)}
              onHoverEnd={() => setIsLogoHovered(false)}
            >
              <Link href="/" className="flex items-center gap-2 relative">
                <motion.div
                  className="relative h-8 w-8 flex-shrink-0"
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, 5, 0, -5, 0],
                  }}
                  transition={{ 
                    duration: 0.5,
                  }}
                >
                  <Image 
                    src="/logo.svg" 
                    alt="Budget Tracker Logo" 
                    width={32} 
                    height={32} 
                    className="h-8 w-8" 
                  />
                  <motion.div
                    className="absolute inset-0 bg-primary/10 rounded-full"
                    initial={{ scale: 0 }}
                    animate={isLogoHovered ? { scale: 1.5, opacity: 0 } : { scale: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.div>
                <motion.span 
                  className="text-foreground truncate"
                  whileHover={{ 
                    color: "var(--primary)",
                    textShadow: "0 0 8px rgba(var(--primary-rgb), 0.3)"
                  }}
                  animate={isLogoHovered ? { 
                    color: "var(--primary)",
                    textShadow: "0 0 8px rgba(var(--primary-rgb), 0.3)"
                  } : {}}
                  transition={{ duration: 0.2 }}
                >
                  BudgetTracker
                </motion.span>
              </Link>
            </motion.div>
            
            {/* Desktop navigation */}
            <div className="desktop-nav-container">
              {["Features", "Pricing", "Testimonials", "About", "Contact"].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="desktop-nav-item text-muted-foreground hover:text-foreground transition-colors duration-200 relative"
                  whileHover={{ color: "var(--primary)", backgroundColor: "rgba(var(--primary-rgb), 0.08)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative overflow-hidden group">
                    <motion.span className="block">{item}</motion.span>
                    <motion.div 
                      className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"
                      initial={{ scaleX: 0, originX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.a>
              ))}
            </div>
            
            {/* Sign in and Sign up buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="ghost" 
                  asChild
                  className="relative overflow-hidden group"
                >
                  <Link href="/auth/login">
                    <span className="relative z-10">Sign in</span>
                    <motion.div 
                      className="absolute inset-0 bg-primary/10 rounded-md"
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </Button>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="relative overflow-hidden rounded-md"
              >
                <Button 
                  asChild
                  className="relative overflow-hidden shadow-lg"
                >
                  <Link href="/auth/register" className="group">
                    <span className="relative z-10 flex items-center gap-1">
                      Get started
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                      >
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </motion.div>
                    </span>
                    <motion.div 
                      className="absolute inset-0 bg-primary-gradient"
                      animate={{ 
                        x: ["0%", "100%"],
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                  </Link>
                </Button>
              </motion.div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="menu-button ml-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-primary/10 rounded-full"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
                {mobileMenuOpen ? <X size={24} /> : <motion.div 
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ repeat: Infinity, repeatType: "loop", duration: 5, repeatDelay: 3 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <motion.path 
                      d="M4 6H20"
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                    <motion.path 
                      d="M4 12H20" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                    <motion.path 
                      d="M4 18H20" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    />
                  </svg>
                </motion.div>}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>
      
      {/* Mobile menu (sliding panel) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              className="mobile-menu-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 dark:bg-white/5 backdrop-blur-md">
                <div className="font-bold text-lg flex items-center gap-2">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-md"></div>
                    <Image 
                      src="/logo.svg" 
                      alt="Budget Tracker Logo" 
                      width={24} 
                      height={24} 
                      className="h-6 w-6 relative" 
                    />
                  </div>
                  <span className="relative truncate">
                    BudgetTracker
                    <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0"></span>
                  </span>
                </div>
                <motion.button
                  onClick={() => setMobileMenuOpen(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-white/10 dark:bg-white/10 rounded-full p-2 backdrop-blur-md border border-white/10 flex-shrink-0 ml-2"
                >
                  <X size={18} />
                </motion.button>
              </div>
              <div className="flex flex-col p-4 space-y-2">
                {["Features", "Pricing", "Testimonials", "About", "Contact"].map((item, i) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="mobile-menu-item"
                    onClick={() => scrollToSection(item.toLowerCase())}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    whileHover={{ x: 5, backgroundColor: "rgba(var(--primary-rgb), 0.08)", color: "var(--primary)" }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-1">
                      <ChevronRight size={14} className="text-primary" />
                    </div> 
                    {item}
                  </motion.a>
                ))}
              </div>
              <div className="mt-auto p-4 space-y-3 border-t border-white/10 backdrop-blur-md bg-white/5">
                <Button variant="outline" className="w-full justify-start backdrop-blur-md bg-white/5 border-white/20" asChild>
                  <Link href="/auth/login">
                    <motion.span 
                      className="flex items-center gap-2"
                      whileHover={{ x: 5 }}
                    >
                      Sign in
                    </motion.span>
                  </Link>
                </Button>
                <Button className="w-full justify-start shadow-md bg-primary-gradient backdrop-blur-md border border-white/20" asChild>
                  <Link href="/auth/register">
                    <motion.span 
                      className="flex items-center gap-2"
                      whileHover={{ x: 5 }}
                    >
                      Get started
                    </motion.span>
                  </Link>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero section */}
      <section className="relative overflow-hidden border-b bg-gradient-hero">
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-30">
            {/* Replace random bubbles with client component */}
            <HeroBubbles />
          </div>
        </div>
        
        <div className="container mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center py-12 md:py-20 lg:py-32 gap-12">
            <motion.div 
              className="flex-1 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-glass text-primary w-fit mb-6 border-animated"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-xs font-semibold">New Feature</span>
                <div className="h-1 w-1 rounded-full bg-primary"></div>
                <span className="text-xs">AI-Powered Budget Recommendations</span>
                <motion.div
                  className="ml-1 animate-float"
                  animate={{ 
                    rotate: [0, 10, -10, 10, 0],
                  }}
                  transition={{ 
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 2, 
                    repeatDelay: 3
                  }}
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                </motion.div>
              </motion.div>

              <motion.h1 
                className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Smart financial tracking for <span className="text-gradient-hero relative">
                  modern living
                  <motion.div 
                    className="absolute -bottom-1 left-0 right-0 h-[3px] bg-primary/40 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                  />
                </span>
              </motion.h1>

              <motion.p 
                className="mt-6 text-lg text-muted-foreground max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                Effortlessly manage your finances, track expenses, and reach your savings goals with our intuitive budget tracking platform.
              </motion.p>
              
              <motion.div 
                className="mt-8 flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button asChild size="lg" className="px-8 py-6 text-base font-semibold group relative overflow-hidden btn-gradient glow-on-hover">
                    <Link href="/auth/register">
                      <span className="relative z-10">Get Started — Free</span>
                      <motion.span
                        className="absolute inset-0 bg-primary/10"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.5 }}
                      />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button asChild variant="outline" size="lg" className="gap-2 px-8 py-6 text-base font-semibold group border-animated">
                    <Link href="#features">
                      See all features 
                      <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="mt-8 pt-4 border-t flex items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div 
                      key={i} 
                      className={`w-8 h-8 rounded-full border-2 border-background bg-primary-${i*100}`}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.9 + (i * 0.1), duration: 0.3 }}
                      whileHover={{ y: -3, scale: 1.1 }}
                    >
                      <span className="sr-only">User Avatar</span>
                    </motion.div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">1,000+</span> people have signed up this month
                </div>
              </motion.div>
              
              {/* New trust badges section */}
              <motion.div
                className="mt-6 flex flex-wrap gap-4 items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.5 }}
              >
                {[
                  { icon: <ShieldCheck className="h-4 w-4" />, text: "Secure & Private" },
                  { icon: <Clock className="h-4 w-4" />, text: "24/7 Support" },
                  { icon: <CheckCircle className="h-4 w-4" />, text: "No Credit Card Required" }
                ].map((badge, i) => (
                  <motion.div 
                    key={i}
                    className="flex items-center gap-1.5 bg-muted/30 text-xs text-muted-foreground px-3 py-1.5 rounded-full"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.1 + (i * 0.1) }}
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--primary), 0.1)" }}
                  >
                    <span className="text-primary">{badge.icon}</span>
                    {badge.text}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="flex-1 w-full max-w-lg mx-auto lg:mx-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="relative rounded-2xl shadow-2xl">
                <motion.div 
                  className="absolute -inset-1 bg-gradient-animated opacity-30 blur-sm rounded-2xl"
                  animate={{ 
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut"
                  }}
                />
                <div className="relative rounded-2xl overflow-hidden border bg-glass">
                  <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
                    <div className="font-semibold flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 10, 0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 5, repeatDelay: 2 }}
                      >
                        <PieChart className="h-4 w-4 text-primary" />
                      </motion.div>
                      Monthly Budget Overview
                    </div>
                    <div className="flex gap-1">
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-red-500" 
                        whileHover={{ scale: 1.5 }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-yellow-500" 
                        whileHover={{ scale: 1.5 }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-green-500" 
                        whileHover={{ scale: 1.5 }}
                      />
                    </div>
                  </div>
                  <div className="p-6 relative">
                    <motion.div 
                      className="absolute top-2 right-2 opacity-10 text-primary"
                      animate={{ 
                        rotate: 360,
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 20,
                        ease: "linear"
                      }}
                    >
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 0C22.4 0 0 22.4 0 50C0 77.6 22.4 100 50 100C77.6 100 100 77.6 100 50C100 22.4 77.6 0 50 0ZM50 90C27.9 90 10 72.1 10 50C10 27.9 27.9 10 50 10C72.1 10 90 27.9 90 50C90 72.1 72.1 90 50 90Z" fill="currentColor"/>
                        <path d="M50 20C33.5 20 20 33.5 20 50C20 66.5 33.5 80 50 80C66.5 80 80 66.5 80 50C80 33.5 66.5 20 50 20ZM50 70C39 70 30 61 30 50C30 39 39 30 50 30C61 30 70 39 70 50C70 61 61 70 50 70Z" fill="currentColor"/>
                      </svg>
                    </motion.div>
                    <div className="flex justify-between mb-10 border border-primary/10 bg-card/60 p-4 rounded-xl shadow-sm">
                      <motion.div
                        className="relative overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <div className="text-sm text-muted-foreground">Total Budget</div>
                        <motion.div 
                          className="text-2xl font-bold flex items-baseline gap-1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.4 }}
                        >
                          <span className="text-gradient-primary">$4,250</span>
                          <span className="text-xs text-muted-foreground">.00</span>
                        </motion.div>
                        <motion.div
                          className="absolute bottom-0 left-0 h-1 w-full bg-primary/20 rounded-full"
                          animate={{
                            scaleX: [0, 1],
                            opacity: [0, 1]
                          }}
                          transition={{ duration: 1, delay: 0.8 }}
                        />
                      </motion.div>
                      <motion.div
                        className="relative overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <div className="text-sm text-muted-foreground text-right">Spent</div>
                        <motion.div 
                          className="text-2xl font-bold text-primary flex items-baseline gap-1 justify-end"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7, duration: 0.4 }}
                        >
                          <span className="text-gradient-primary">$2,840</span>
                          <span className="text-xs text-muted-foreground">.50</span>
                        </motion.div>
                        <motion.div
                          className="absolute bottom-0 left-0 h-1 w-full bg-primary/20 rounded-full"
                          animate={{
                            scaleX: [0, 1],
                            opacity: [0, 1]
                          }}
                          transition={{ duration: 1, delay: 0.9 }}
                        />
                      </motion.div>
                    </div>
                    
                    <motion.div 
                      className="flex items-center justify-between mb-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Wallet className="h-4 w-4 text-primary" /> 
                        <span>Categories</span>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-full">
                        {Math.floor(2840/4250 * 100)}% used
                      </div>
                    </motion.div>
                    
                    <div className="space-y-4 relative z-10">
                      {[
                        { category: "Housing", amount: "$1,200", percentage: 75, icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 12h3v9h16v-9h3L12 2z"></path></svg> },
                        { category: "Food & Dining", amount: "$620", percentage: 60, icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11 7h2v7h-2zm1-5a10 10 0 100 20z"></path></svg> },
                        { category: "Transportation", amount: "$450", percentage: 90, icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18 15H6v-2h12v2zM4 19h16v-2H4v2zM16 8l-4-4-4 4h2v4h4V8h2z"></path></svg> },
                        { category: "Entertainment", amount: "$320", percentage: 40, icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6z"></path><path d="M17 14c0 2.76-2.24 5-5 5s-5-2.24-5-5h-2c0 3.53 2.61 6.43 6 6.92V22h2v-1.08c3.39-.49 6-3.39 6-6.92h-2z"></path></svg> }
                      ].map((item, idx) => (
                        <motion.div 
                          key={item.category} 
                          className="bg-card/30 rounded-lg p-3 border border-primary/5 space-y-2 card-hover-effect"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + (idx * 0.1), duration: 0.4 }}
                          whileHover={{ 
                            x: 5, 
                            backgroundColor: "rgba(var(--card), 0.8)",
                            borderColor: "rgba(var(--primary), 0.2)"
                          }}
                        >
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="bg-primary/10 rounded-full p-1 text-primary">
                                {item.icon}
                              </div>
                              <span>{item.category}</span>
                            </div>
                            <span className="font-medium">{item.amount}</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden relative">
                            <motion.div 
                              className={`h-full ${
                                item.percentage > 80 
                                  ? "bg-gradient-danger" 
                                  : item.percentage > 60 
                                    ? "bg-gradient-warning" 
                                    : "bg-gradient-success"
                              } transition-all`}
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ delay: 1 + (idx * 0.1), duration: 0.7, ease: "easeOut" }}
                            />
                            <motion.div 
                              className="absolute top-0 right-0 bottom-0 bg-white opacity-30 w-[5px]"
                              animate={{ 
                                left: ["100%", `${item.percentage}%`], 
                                opacity: [0, 0.5, 0]
                              }}
                              transition={{ 
                                delay: 1.4 + (idx * 0.1), 
                                duration: 0.8, 
                                ease: "easeOut",
                                times: [0, 0.8, 1] 
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div 
                      className="absolute bottom-3 right-3"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        x: [0, 5, 0],
                        y: [0, 5, 0],
                      }}
                      transition={{ 
                        delay: 1.5,
                        duration: 3,
                        ease: "easeInOut",
                        repeat: Infinity
                      }}
                    >
                      <MousePointer className="h-5 w-5 text-muted-foreground/40" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            className="flex flex-wrap justify-center gap-8 pb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            {['Trusted by thousands', 'Bank-level security', '99.9% uptime', 'Free starter plan'].map((item, idx) => (
              <motion.div 
                key={item} 
                className="flex items-center gap-2 text-sm text-muted-foreground glow-on-hover bg-glass py-1 px-3 rounded-full"
                whileHover={{ scale: 1.05, color: "var(--primary)" }}
                transition={{ duration: 0.2 }}
              >
                <Check size={16} className="text-primary" />
                <span>{item}</span>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Scroll down indicator */}
          <motion.div 
            className="hidden md:flex justify-center mb-6 absolute bottom-0 left-0 right-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <motion.div
              className="flex flex-col items-center gap-2 text-xs text-muted-foreground cursor-pointer group"
              onClick={() => scrollToSection('features')}
              whileHover={{ y: -2 }}
            >
              <span className="group-hover:text-primary transition-colors">Scroll to discover</span>
              <motion.div
                initial={{ y: -5 }}
                animate={{ y: 5 }}
                transition={{ 
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 1.5,
                  ease: "easeInOut"
                }}
              >
                <ChevronDown className="h-5 w-5 text-primary/70 group-hover:text-primary" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features section - "Everything you need to manage your money" */}
      <section id="features" className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-5"></div>
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-20"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 15,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        
        {/* Replace random decorative elements with client component */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FeatureBubbles />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="max-w-xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.h2 
                className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 relative"
                animate={{ 
                  textShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 8px rgba(var(--primary-rgb), 0.3)", "0px 0px 0px rgba(0,0,0,0)"]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                Everything you need to <span className="text-gradient-primary relative inline-block">
                  manage your money
                  <motion.div 
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary/30 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                  />
                </span>
              </motion.h2>
            </motion.div>
            <motion.p 
              className="text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Powerful tools to help you take control of your finances and achieve your financial goals.
            </motion.p>
          </motion.div>
          
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const featureRef = useRef(null);
              const isInView = useInView(featureRef, { once: true, amount: 0.3 });
              
              return (
                <motion.div
                  key={feature.title}
                  ref={featureRef}
                  className="relative group"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <motion.div 
                    className="absolute -inset-4 scale-95 bg-gradient-to-r from-primary/5 to-primary/0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    animate={isInView ? { 
                      scale: [0.95, 1],
                      opacity: [0, 0.2, 0], 
                    } : {}}
                    transition={{ 
                      delay: index * 0.1 + 0.3, 
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      repeatDelay: 2
                    }}
                  />
                  <div className="relative p-6 rounded-xl border border-muted bg-card/40 hover:bg-card/80 transition-all duration-300 group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/5 h-full">
                    <motion.div 
                      className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary relative overflow-hidden mb-5"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div 
                        className="absolute inset-0 bg-primary"
                        initial={{ y: "100%" }}
                        whileHover={{ y: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.div
                        className="relative z-10"
                        whileHover={{ scale: 1.1, color: "white" }}
                        animate={isInView ? { 
                          y: [5, 0],
                          opacity: [0, 1]
                        } : {}}
                        transition={{ 
                          delay: index * 0.1 + 0.1, 
                          duration: 0.5 
                        }}
                      >
                        {feature.icon}
                      </motion.div>
                    </motion.div>
                    
                    <motion.h3 
                      className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300"
                      initial={{ opacity: 0 }}
                      animate={isInView ? { 
                        opacity: 1,
                        y: [5, 0]
                      } : {}}
                      transition={{ delay: index * 0.1 + 0.1, duration: 0.5 }}
                    >
                      {feature.title}
                    </motion.h3>
                    
                    <motion.p 
                      className="text-muted-foreground mb-4"
                      initial={{ opacity: 0 }}
                      animate={isInView ? { 
                        opacity: 1,
                        y: [5, 0]
                      } : {}}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                    >
                      {feature.description}
                    </motion.p>
                    
                    <motion.div 
                      className="flex items-center gap-1 text-sm text-primary/80 font-medium mt-auto"
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                      whileHover={{ x: 5 }}
                    >
                      <span>Learn more</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity, 
                          repeatDelay: 3
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          <motion.div 
            className="mt-24 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-500"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -5 }}
          >
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <motion.h3 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <span className="text-gradient-primary">Advanced Budget Analytics</span>
                </motion.h3>
                <motion.p 
                  className="text-muted-foreground mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  Get powerful insights into your spending patterns with our intuitive analytics dashboard. Identify trends, spot opportunities to save, and make data-driven financial decisions.
                </motion.p>
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {[
                    { title: "Personalized Insights", description: "Tailored recommendations based on your spending habits" },
                    { title: "Smart Categories", description: "Customizable and automatically organized expense groups" },
                    { title: "Goal Tracking", description: "Visual progress meters toward your financial objectives" },
                    { title: "Monthly Reports", description: "Detailed breakdowns and year-over-year comparisons" }
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx} 
                      className="flex items-start gap-2 group"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + idx * 0.1, duration: 0.4 }}
                      whileHover={{ x: 5 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + idx * 0.1, duration: 0.4, type: "spring" }}
                        className="mt-1 flex-shrink-0 rounded-full p-1 bg-primary/10 text-primary"
                        whileHover={{ 
                          scale: 1.1, 
                          backgroundColor: "var(--primary)",
                          color: "white" 
                        }}
                      >
                        <Check size={12} />
                      </motion.div>
                      <div>
                        <div className="font-medium text-sm group-hover:text-primary transition-colors">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden rounded-md"
                >
                  <Button asChild variant="outline" className="w-fit group relative z-10 border-primary/30">
                    <Link href="/auth/register">
                      <motion.span 
                        className="flex items-center gap-2 text-primary"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        Try analytics now
                        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </motion.span>
                    </Link>
                  </Button>
                  <motion.div 
                    className="absolute inset-0 bg-primary/5"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
              </div>
              <motion.div 
                className="bg-muted/30 p-6 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <ParallaxWrapper>
                  <div className="rounded-lg border bg-glass p-4 shadow-md max-w-md w-full relative">
                    {/* Background design elements */}
                    <motion.div 
                      className="absolute -right-16 -top-16 w-32 h-32 bg-primary/5 rounded-full"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 6,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div 
                      className="absolute -left-16 -bottom-16 w-32 h-32 bg-primary/5 rounded-full"
                      animate={{ 
                        scale: [1.1, 0.9, 1.1],
                        opacity: [0.3, 0.5, 0.3]
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 5,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between relative z-10">
                      <motion.div 
                        className="flex items-center gap-2"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          animate={{ 
                            rotate: [0, 360]
                          }}
                          transition={{ 
                            duration: 20, 
                            ease: "linear", 
                            repeat: Infinity 
                          }}
                        >
                          <BarChart className="h-5 w-5 text-primary" />
                        </motion.div>
                        <h4 className="font-semibold">Your Spending Analysis</h4>
                      </motion.div>
                      
                      <motion.div 
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                        initial={{ x: 20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        whileHover={{ 
                          scale: 1.05, 
                          backgroundColor: "var(--primary)", 
                          color: "white" 
                        }}
                      >
                        <span className="relative z-10">Last Quarter</span>
                      </motion.div>
                    </div>
                    
                    {/* Stats row */}
                    <motion.div 
                      className="grid grid-cols-2 gap-3 mb-6"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      <motion.div 
                        className="bg-background/50 rounded-lg p-3 border border-border/50"
                        whileHover={{ y: -2, backgroundColor: "var(--background)" }}
                      >
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Total Spending
                        </div>
                        <div className="text-xl font-bold">$4,280<span className="text-xs font-normal text-muted-foreground">.50</span></div>
                        <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <motion.div animate={{ y: [0, -1, 0] }} transition={{ repeat: Infinity, duration: 1 }}>↓</motion.div> 12% from last period
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="bg-background/50 rounded-lg p-3 border border-border/50"
                        whileHover={{ y: -2, backgroundColor: "var(--background)" }}
                      >
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <LineChart className="h-3 w-3" /> Avg. Monthly
                        </div>
                        <div className="text-xl font-bold">$1,426<span className="text-xs font-normal text-muted-foreground">.83</span></div>
                        <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                          <motion.div animate={{ x: [0, 1, 0, -1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>↔</motion.div> Stable spending
                        </div>
                      </motion.div>
                    </motion.div>
                    
                    {/* Spending breakdown */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium">Top Categories</div>
                        <div className="text-xs text-muted-foreground">% of total</div>
                      </div>
                      
                      {[
                        { name: "Housing", percentage: 35, color: "bg-blue-500" },
                        { name: "Food & Dining", percentage: 22, color: "bg-purple-500" },
                        { name: "Transportation", percentage: 18, color: "bg-green-500" },
                        { name: "Entertainment", percentage: 12, color: "bg-amber-500" }
                      ].map((category, idx) => (
                        <motion.div 
                          key={category.name}
                          className="mb-3 last:mb-0"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + (idx * 0.1), duration: 0.4 }}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-xs flex items-center gap-1.5">
                              <motion.div 
                                className={`h-2 w-2 rounded-full ${category.color}`}
                                whileHover={{ scale: 1.5 }}
                                transition={{ duration: 0.2 }}
                              />
                              {category.name}
                            </div>
                            <div className="text-xs font-medium">{category.percentage}%</div>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${category.color}`}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${category.percentage}%` }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.5 + (idx * 0.1), duration: 0.7, ease: "easeOut" }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                    
                    {/* AI Insights */}
                    <motion.div 
                      className="mt-5 pt-4 border-t flex flex-col gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      <div className="text-xs font-medium flex items-center gap-1.5">
                        <motion.div
                          animate={{ 
                            rotate: [0, 0, 0, 10, -10, 0, 0],
                            scale: [1, 1, 1, 1.1, 1.1, 1, 1]
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 4,
                            repeatDelay: 3
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </motion.div>
                        <span>AI-Powered Insights</span>
                      </div>
                      <motion.div 
                        className="text-xs text-muted-foreground bg-primary/5 p-2 rounded"
                        whileHover={{ backgroundColor: "var(--primary-10)" }}
                      >
                        Food expenses increased by 8% this month. Consider setting a specific dining budget.
                      </motion.div>
                    </motion.div>
                  </div>
                </ParallaxWrapper>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Testimonials section */}
      <section id="testimonials" className="py-20 md:py-32 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-30"
          animate={{
            y: ["0%", "100%"],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        
        {/* Add client component for testimonial bubbles */}
        <div className="absolute inset-0" style={{ opacity: 0.6 }}>
          <TestimonialBubbles />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="max-w-xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h3 
              className="text-sm text-primary font-medium uppercase tracking-wider mb-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
            >
              Testimonials
            </motion.h3>
            <motion.h2 
              className="text-3xl font-bold tracking-tight sm:text-4xl mb-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Hear what our users are saying
            </motion.h2>
            <motion.p 
              className="text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Real stories from real people who have taken control of their finances with our platform.
            </motion.p>
          </motion.div>
          
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={testimonial.name}
                className="flex flex-col h-full bg-glass border rounded-xl p-6 relative group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.1)" }}
              >
                <motion.div 
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/5 via-primary/40 to-primary/5 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 + 0.2, duration: 0.6 }}
                />
                
                {/* Floating quote mark */}
                <motion.div
                  className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 + 0.3, duration: 0.4 }}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 11L8 13L6 11V6H10V11Z" fill="currentColor" />
                    <path d="M18 11L16 13L14 11V6H18V11Z" fill="currentColor" />
                  </svg>
                </motion.div>
                
                <div className="mb-4 flex">
                  {[...Array(5)].map((_, starIdx) => (
                    <motion.div
                      key={starIdx}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        delay: idx * 0.1 + 0.3 + starIdx * 0.05, 
                        duration: 0.3,
                        type: "spring"
                      }}
                    >
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    </motion.div>
                  ))}
                </div>
                
                <motion.blockquote 
                  className="flex-1 mb-6 text-muted-foreground relative"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 + 0.3, duration: 0.5 }}
                >
                  <motion.span 
                    className="absolute -top-2 -left-1 text-4xl text-primary/20"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 + 0.2, duration: 0.4 }}
                  >
                    "
                  </motion.span>
                  <p className="relative text-foreground/90 italic">{testimonial.quote}</p>
                  <motion.span 
                    className="absolute -bottom-2 -right-1 text-4xl text-primary/20"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 + 0.2, duration: 0.4 }}
                  >
                    "
                  </motion.span>
                </motion.blockquote>
                
                <motion.div 
                  className="flex items-center mt-auto pt-4 border-t border-muted/40"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 + 0.4, duration: 0.5 }}
                >
                  <motion.div
                    className="w-12 h-12 rounded-full mr-4 border-2 border-primary/20 overflow-hidden"
                    whileHover={{ scale: 1.1, borderColor: "var(--primary)" }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 + 0.5, duration: 0.4 }}
                  >
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <div>
                    <motion.div 
                      className="font-medium text-foreground"
                      initial={{ opacity: 0, y: 5 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 + 0.5, duration: 0.3 }}
                    >
                      {testimonial.name}
                    </motion.div>
                    <motion.div 
                      className="text-sm text-primary/80"
                      initial={{ opacity: 0, y: 5 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 + 0.6, duration: 0.3 }}
                    >
                      {testimonial.title}
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Added success indicator */}
                <motion.div
                  className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-muted px-3 py-1 rounded-full text-xs font-medium border border-muted/50 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ y: 10, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-green-500">
                    <CheckCircle className="h-3 w-3 inline" />
                  </span>
                  <span className="text-muted-foreground">Verified Customer</span>
                </motion.div>
              </motion.div>
            ))}
          </div>
          
          {/* Testimonial highlight - Added callout */}
          <motion.div 
            className="mt-16 max-w-3xl mx-auto bg-glass border border-primary/10 rounded-xl p-8 relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -5, boxShadow: "0 15px 30px -10px rgba(var(--primary-rgb), 0.1)" }}
          >
            <motion.div 
              className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-primary/5 blur-2xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <motion.div 
                className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/20 flex-shrink-0"
                whileHover={{ scale: 1.05, borderColor: "var(--primary)" }}
              >
                <img 
                  src="https://randomuser.me/api/portraits/men/32.jpg" 
                  alt="Featured Testimonial" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <div className="flex-1">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                    >
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-lg font-medium italic text-foreground mb-4">
                  "This app completely transformed how I manage my finances. The AI recommendations have saved me hundreds of dollars each month!"
                </p>
                <div>
                  <div className="font-semibold">Michael Thompson</div>
                  <div className="text-sm text-primary/80">Small Business Owner</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/20"></div>
        
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="max-w-xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                Start for free, upgrade when you need more features.
              </p>
            </motion.div>
          </motion.div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                title: "Free",
                price: "$0",
                description: "Perfect for getting started with basic budgeting",
                features: [
                  "Up to 3 budget categories",
                  "Basic expense tracking",
                  "Monthly spending reports",
                  "Email support"
                ],
                cta: "Get Started",
                popular: false
              },
              {
                title: "Premium",
                price: "$9.99",
                per: "month",
                description: "Everything you need for serious money management",
                features: [
                  "Unlimited categories",
                  "Advanced analytics dashboard",
                  "Custom budget goals",
                  "Recurring expenses",
                  "Priority support",
                  "Bank account sync"
                ],
                cta: "Upgrade to Premium",
                popular: true
              },
              {
                title: "Family",
                price: "$19.99",
                per: "month",
                description: "Manage finances together with your family",
                features: [
                  "All Premium features",
                  "Up to 5 user accounts",
                  "Shared budget categories",
                  "Family spending insights",
                  "Bill splitting",
                  "Dedicated support"
                ],
                cta: "Start Family Plan",
                popular: false
              }
            ].map((plan, index) => (
              <motion.div 
                key={index}
                className={`bg-card rounded-xl border ${plan.popular ? 'border-primary shadow-lg' : 'shadow-sm'} overflow-hidden flex flex-col`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
              >
                {plan.popular && (
                  <motion.div 
                    className="bg-primary/10 text-primary text-center text-sm font-medium py-1 relative overflow-hidden"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-primary/10"
                      animate={{ 
                        x: ["-100%", "100%"] 
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 2
                      }}
                    />
                    <span className="relative z-10">Most Popular</span>
                  </motion.div>
                )}
                <div className="p-6 md:p-8 flex-1">
                  <div className="font-semibold text-lg mb-2">{plan.title}</div>
                  <motion.div 
                    className="flex items-baseline gap-1 mb-4"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
                  >
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.per && <span className="text-muted-foreground">/{plan.per}</span>}
                  </motion.div>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <motion.li 
                        key={feature} 
                        className="flex items-start gap-2 text-sm group"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.2 + idx * 0.05, duration: 0.4 }}
                      >
                        <motion.div
                          whileHover={{ rotate: 180, backgroundColor: "var(--primary)" }}
                          transition={{ duration: 0.3 }}
                          className="mt-0.5 flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center bg-primary/10"
                        >
                          <Check size={10} className="text-primary group-hover:text-white" />
                        </motion.div>
                        <span>{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
                <div className="px-6 pb-8">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button 
                      asChild 
                      className="w-full relative overflow-hidden" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      <Link href="/auth/register">
                        <motion.span
                          className="absolute inset-0 bg-primary/10"
                          initial={{ width: 0 }}
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3 }}
                        />
                        <span className="relative z-10">{plan.cta}</span>
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            className="max-w-3xl mx-auto mt-16 p-6 bg-muted/30 rounded-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="font-medium mb-2">Need a custom solution?</div>
            <p className="text-muted-foreground text-sm mb-4">
              Contact us for tailored enterprise solutions with advanced features and dedicated support.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button variant="outline" size="sm">Contact Sales</Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 md:py-24 bg-gradient-cta text-white relative overflow-hidden">
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated Gradient Background */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/40 to-primary/80"
            animate={{
              backgroundPosition: ["0% 0%", "100% 0%"],
            }}
            transition={{
              duration: 15,
              ease: "linear",
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          
          <div className="absolute top-0 left-0 right-0 h-px bg-white/30"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/30"></div>
          
          {/* Replace random elements with fixed CTABubbles */}
          <CTABubbles />
        </motion.div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-5 gap-8 items-center">
              <motion.div 
                className="md:col-span-3 text-center md:text-left"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="inline-flex items-center px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6 border border-white/20 gap-2 shadow-lg shadow-primary/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, 0, -10, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                  <motion.span 
                    animate={{ 
                      color: ["rgba(255,255,255,0.9)", "rgba(255,255,255,1)", "rgba(255,255,255,0.9)"] 
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity 
                    }}
                  >
                    <span className="font-semibold">10,000+</span> happy users already
                  </motion.span>
                </motion.div>
                
                <motion.h2 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-shadow-glow"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  Transform your financial <motion.span 
                    className="relative inline-block"
                    initial={{ color: "white" }}
                    animate={{ 
                      color: ["rgba(255,255,255,1)", "rgba(255,255,255,0.85)", "rgba(255,255,255,1)"],
                      textShadow: ["0 0 10px rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.5)", "0 0 10px rgba(255,255,255,0)"]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    future today
                    <motion.div 
                      className="absolute -bottom-1 left-0 right-0 h-1 bg-white/40 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.7, duration: 0.8 }}
                    />
                  </motion.span>
                </motion.h2>
                
                <motion.p 
                  className="mb-8 text-lg text-white/90 max-w-xl mx-auto md:mx-0 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  Start your journey to financial freedom today with our powerful, intuitive budgeting tools. Join thousands who've already transformed how they manage money.
                </motion.p>
                
                {/* Trust indicators */}
                <motion.div
                  className="flex flex-wrap gap-4 mb-8 justify-center md:justify-start"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {[
                    { icon: <Lock className="h-4 w-4" />, text: "Bank-level Security" },
                    { icon: <Clock className="h-4 w-4" />, text: "Setup in 2 minutes" },
                    { icon: <BadgeDollarSign className="h-4 w-4" />, text: "Free forever plan" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-1.5 text-xs bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                    >
                      {item.icon}
                      <span>{item.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <motion.div
                    className="group relative overflow-hidden rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors duration-300"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    />
                    <motion.div
                      className="absolute -inset-full h-32 w-32 z-0 rotate-45 transform bg-white opacity-20 group-hover:opacity-30 transition-opacity blur-xl"
                      animate={{ 
                        left: ["-100%", "200%"], 
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        repeatDelay: 3 
                      }}
                    />
                    <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 border-0 px-8 py-6 text-base shadow-lg shadow-primary/20 relative z-10">
                      <Link href="/auth/register">
                        <motion.span 
                          className="flex items-center gap-2 font-semibold"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          Get Started — Free
                          <ArrowRight className="h-4 w-4" />
                        </motion.span>
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button asChild variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10 px-8 py-6 text-base backdrop-blur-sm">
                      <Link href="/dashboard">
                        <motion.span 
                          className="flex items-center gap-2"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          View Demo
                          <ChevronRight className="h-4 w-4 transition-transform" />
                        </motion.span>
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
              
              {/* Stats/Testimonial Card */}
              <motion.div
                className="md:col-span-2 perspective"
                initial={{ opacity: 0, scale: 0.95, rotateY: 5 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                whileHover={{ scale: 1.02, rotateY: -2 }}
              >
                <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-2xl relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-white/5 to-white/10"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  />
                  
                  {/* Decorative elements */}
                  <motion.div
                    className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-white/5 blur-xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity
                    }}
                  />
                  
                  <motion.div 
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="bg-green-500/20 p-1 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                      </div>
                      <span className="text-sm font-medium text-white">Verified Results</span>
                    </div>
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <motion.div 
                          key={i}
                          className="w-6 h-6 rounded-full border border-white/40 bg-white/20"
                          initial={{ x: 10, opacity: 0 }}
                          whileInView={{ x: 0, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.6 + (i * 0.1), duration: 0.3 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    {[
                      { value: "94%", label: "User satisfaction" },
                      { value: "30%", label: "Average savings" },
                      { value: "15min", label: "Setup time" },
                      { value: "100%", label: "Data security" }
                    ].map((stat, idx) => (
                      <motion.div 
                        key={idx}
                        className="text-center"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + (idx * 0.1), duration: 0.4 }}
                      >
                        <motion.div 
                          className="text-2xl font-bold"
                          animate={{ 
                            textShadow: ["0px 0px 0px rgba(255,255,255,0)", "0px 0px 10px rgba(255,255,255,0.5)", "0px 0px 0px rgba(255,255,255,0)"]
                          }}
                          transition={{ 
                            duration: 2 + idx, 
                            repeat: Infinity,
                            repeatDelay: 1
                          }}
                        >
                          {stat.value}
                        </motion.div>
                        <div className="text-sm text-white/70">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Testimonial quote */}
                  <motion.blockquote
                    className="text-sm text-white/80 border-l-2 border-white/30 pl-4 italic mb-6"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7, duration: 0.4 }}
                  >
                    "Budget Tracker helped me save for my dream vacation in just 6 months. The visual insights made all the difference!"
                  </motion.blockquote>
                  
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium">JD</div>
                    <div>
                      <div className="text-sm font-medium">Jamie Davis</div>
                      <div className="text-xs text-white/70">Saved $4,200 in 6 months</div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-secondary/10 blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet The Developer</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Passion, innovation, and expertise driving the Budget Tracker to help you achieve financial freedom
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-border/40 max-w-5xl mx-auto"
          >
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <motion.div 
                  className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-primary/20 flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full" />
                  <Image 
                    src="/developer-profile.svg" 
                    alt="Aditya Kumar Tiwari" 
                    width={144} 
                    height={144} 
                    className="object-cover"
                    priority
                  />
                </motion.div>
                
                <div className="flex-1 text-center md:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <h3 className="text-2xl font-bold mb-1">Aditya Kumar Tiwari</h3>
                    <p className="text-primary mb-3">Cybersecurity Enthusiast | Web Developer | Lifelong Learner</p>
                    
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                      <Badge variant="secondary" className="px-3 py-1">Cybersecurity</Badge>
                      <Badge variant="secondary" className="px-3 py-1">Python</Badge>
                      <Badge variant="secondary" className="px-3 py-1">JavaScript</Badge>
                      <Badge variant="secondary" className="px-3 py-1">HTML/CSS</Badge>
                      <Badge variant="secondary" className="px-3 py-1">Linux</Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-6">
                      Aditya is a passionate Cybersecurity Specialist and Full-Stack Developer currently pursuing a BCA in 
                      Cybersecurity at Sushant University. He thrives at the intersection of technology and innovation, 
                      crafting secure and scalable solutions for real-world challenges.
                    </p>
                    
                    <div className="flex gap-3 justify-center md:justify-start">
                      <Link 
                        href="https://iaddy.netlify.app/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        Portfolio
                      </Link>
                      <Link 
                        href="https://www.linkedin.com/in/itisaddy/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                          <rect x="2" y="9" width="4" height="12" />
                          <circle cx="4" cy="4" r="2" />
                        </svg>
                        LinkedIn
                      </Link>
                      <Link 
                        href="https://www.instagram.com/i__aditya7/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                        Instagram
                      </Link>
                    </div>
                    
                    <motion.div 
                      className="mt-4"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.7 }}
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-card/80 border border-border/50 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        <a href="mailto:itisaddy7@gmail.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">itisaddy7@gmail.com</a>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
              
              <motion.div 
                className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    Professional Experience
                  </h4>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background transition-colors duration-300">
                      <div className="font-medium">Mentor (Part-time)</div>
                      <div className="text-sm text-muted-foreground">JhaMobii Technologies Pvt. Ltd., Remote</div>
                      <div className="text-xs text-primary mb-2">Aug 2025 - Present</div>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Provided technical mentorship in cybersecurity</li>
                        <li>• Guided team members through vulnerability assessments</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background transition-colors duration-300">
                      <div className="font-medium">Cybersecurity Intern</div>
                      <div className="text-sm text-muted-foreground">Null, Remote</div>
                      <div className="text-xs text-primary mb-2">Jun 2025 - Present</div>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Conducted vulnerability assessments</li>
                        <li>• Monitored network traffic and responded to security incidents</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    Certifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="py-2 px-3 rounded-lg border border-primary/30 bg-primary/5 text-primary font-medium text-sm text-center">Foundations of Cybersecurity</div>
                    <div className="py-2 px-3 rounded-lg border border-primary/30 bg-primary/5 text-primary font-medium text-sm text-center">Cyber Threat Management</div>
                    <div className="py-2 px-3 rounded-lg border border-primary/30 bg-primary/5 text-primary font-medium text-sm text-center">OSForensics Triage</div>
                    <div className="py-2 px-3 rounded-lg border border-primary/30 bg-primary/5 text-primary font-medium text-sm text-center">Endpoint Security</div>
                    <div className="py-2 px-3 rounded-lg border border-primary/30 bg-primary/5 text-primary font-medium text-sm text-center">ISO 27001</div>
                    <div className="py-2 px-3 rounded-lg border border-primary/30 bg-primary/5 text-primary font-medium text-sm text-center">Ethical Hacker</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="absolute bottom-20 -left-20 w-72 h-72 rounded-full bg-secondary/10 blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/40 p-8 shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Email</h4>
                    <a href="mailto:itisaddy7@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">itisaddy7@gmail.com</a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Connect</h4>
                    <div className="flex gap-2 mt-2">
                      <a 
                        href="https://www.linkedin.com/in/itisaddy/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                      </a>
                      <a 
                        href="https://github.com/itisaddy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                      </a>
                      <a 
                        href="https://www.instagram.com/i__aditya7/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/40 p-8 shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-4">Send a Message</h3>
              <form className="space-y-4" name="contact" method="POST" data-netlify="true">
                <input type="hidden" name="form-name" value="contact" />
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    className="w-full px-4 py-2 rounded-md border border-border bg-background/50" 
                    placeholder="Your name" 
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    className="w-full px-4 py-2 rounded-md border border-border bg-background/50" 
                    placeholder="your@email.com" 
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
                  <textarea 
                    id="message" 
                    name="message"
                    rows={4} 
                    className="w-full px-4 py-2 rounded-md border border-border bg-background/50" 
                    placeholder="How can we help you?"
                    required
                  ></textarea>
                </div>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2"
                >
                  <Button 
                    type="submit" 
                    className="w-full relative overflow-hidden"
                  >
                    <motion.span
                      className="absolute inset-0 bg-primary/10"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10">Send Message</span>
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/80 border-t border-border/40 pt-16 pb-10 relative z-10">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl opacity-70"></div>
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-secondary/5 blur-3xl opacity-70"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Footer top section with logo and quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative h-10 w-10 bg-primary/10 rounded-xl p-2 flex items-center justify-center">
                  <Image 
                    src="/logo.svg" 
                    alt="Budget Tracker Logo" 
                    width={24} 
                    height={24} 
                    className="h-6 w-6" 
                  />
                </div>
                <span className="font-bold text-xl">Budget Tracker</span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                Your personal finance companion for smart budgeting, expense tracking, and financial insights in one beautiful app.
              </p>
              
              <div className="flex space-x-3 mb-8">
                <a 
                  href="mailto:itisaddy7@gmail.com"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-background shadow-sm border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:scale-110 transition-all duration-200"
                  aria-label="Email"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </a>
                <a 
                  href="https://www.linkedin.com/in/itisaddy/"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-background shadow-sm border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:scale-110 transition-all duration-200"
                  aria-label="LinkedIn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a 
                  href="https://www.instagram.com/i__aditya7/"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-background shadow-sm border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:scale-110 transition-all duration-200"
                  aria-label="Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a 
                  href="https://github.com/itisaddy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-background shadow-sm border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:scale-110 transition-all duration-200"
                  aria-label="GitHub"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                </a>
              </div>
            </div>

            {/* Navigation columns */}
            {["Product", "Company", "Resources", "Legal"].map((section, i) => (
              <div key={section} className="space-y-4">
                <h3 className="font-semibold text-base">{section}</h3>
                <ul className="space-y-3">
                  {(section === "Product" ?
                    ["Features", "Integrations", "Pricing", "Changelog"] :
                  section === "Company" ?
                    ["About Us", "Careers", "Blog", "Press"] :
                  section === "Resources" ?
                    ["Help Center", "Contact Us", "Community", "Status"] :
                    ["Terms of Service", "Privacy Policy", "Cookie Policy", "Compliance"]).map((item) => (
                    <li key={item}>
                      <a 
                        href="#" 
                        className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-block"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {/* Footer bottom with copyright and links */}
          <div className="mt-12 pt-6 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <p className="text-xs text-muted-foreground">© 2025 Budget Tracker. All rights reserved.</p>
              <div className="flex items-center gap-4 md:border-l md:border-border/30 md:pl-4">
                <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms</a>
                <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Cookies</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative h-8 w-8 bg-background rounded-full border border-border/50 shadow-sm flex items-center justify-center overflow-hidden">
                <ThemeToggle iconOnly />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    title: "Intuitive Expense Tracking",
    description: "Effortlessly record and categorize your daily expenses with our adaptive UI that learns your habits for faster input and organization.",
    icon: <Wallet className="h-6 w-6" />,
  },
  {
    title: "Smart Budget Management",
    description: "Create personalized budgets with our intelligent suggestion system and track progress with interactive visual indicators and real-time alerts.",
    icon: <PieChart className="h-6 w-6" />,
  },
  {
    title: "Advanced Financial Insights",
    description: "Discover spending patterns with our immersive data visualization suite featuring customizable charts, trend analysis, and predictive forecasting.",
    icon: <LineChart className="h-6 w-6" />,
  },
  {
    title: "Seamless Goal Setting",
    description: "Set and achieve financial goals with our progress tracking system featuring micro-rewards and milestone celebrations to keep you motivated.",
    icon: <TrendingUp className="h-6 w-6" />,
  },
  {
    title: "Smart Expense Management",
    description: "Manage recurring expenses with our intelligent reminder system that provides proactive notifications and subscription optimization suggestions.",
    icon: <Calendar className="h-6 w-6" />,
  },
  {
    title: "Enhanced Security & Privacy",
    description: "Rest assured with our advanced encryption, biometric authentication options, and granular privacy controls that put you in charge of your data.",
    icon: <ShieldCheck className="h-6 w-6" />,
  },
];

const testimonials = [
  {
    name: "Alex Johnson",
    title: "Small Business Owner",
    quote: "Budget Tracker completely transformed how I manage both my personal and business finances. The insights have helped me save over $5,000 in the past year alone.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
  },
  {
    name: "Sarah Williams",
    title: "Financial Planner",
    quote: "I recommend Budget Tracker to all my clients. It's intuitive, comprehensive, and makes financial planning accessible to everyone.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
  },
  {
    name: "Michael Chen",
    title: "Software Engineer",
    quote: "As someone who was terrible at tracking expenses, this app has been a game-changer. The automated categorization saves me hours each month.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
  },
  {
    name: "Priya Patel",
    title: "Graduate Student",
    quote: "Living on a student budget was challenging until I found Budget Tracker. Now I can see exactly where my money goes and make informed decisions.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
  },
  {
    name: "David Kim",
    title: "Healthcare Professional",
    quote: "The goal setting feature helped me save for a down payment on my house. The visual progress trackers kept me motivated throughout the journey.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
  },
  {
    name: "Emma Rodriguez",
    title: "Marketing Manager",
    quote: "I've tried many budget apps, but this one strikes the perfect balance between powerful features and ease of use. Highly recommend!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma"
  }
]; 

const developers = [
  {
    name: "Alex Chen",
    role: "Lead Developer",
    bio: "Full-stack developer passionate about creating intuitive financial tools that empower users to achieve their goals.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    socials: [
      {
        platform: "LinkedIn",
        url: "https://linkedin.com",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
      },
      {
        platform: "GitHub",
        url: "https://github.com",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
      },
      {
        platform: "Twitter",
        url: "https://twitter.com",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
      }
    ]
  },
  {
    name: "Sophia Rodriguez",
    role: "UI/UX Designer",
    bio: "Design enthusiast focused on creating beautiful, accessible interfaces that make managing finances a delightful experience.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
    socials: [
      {
        platform: "LinkedIn",
        url: "https://linkedin.com",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
      },
      {
        platform: "Dribbble",
        url: "https://dribbble.com",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94"/><path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32"/><path d="M8.56 2.75c4.37 6 6 9.42 8 17.72"/></svg>
      },
      {
        platform: "Instagram",
        url: "https://instagram.com",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
      }
    ]
  },
  {
    name: "Marcus Johnson",
    role: "Backend Developer",
    bio: "Security and database specialist ensuring your financial data is protected with the latest encryption technologies.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    socials: [
      {
        platform: "LinkedIn",
        url: "https://linkedin.com",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
      },
      {
        platform: "GitHub",
        url: "https://github.com",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
      },
      {
        platform: "Stack Overflow",
        url: "https://stackoverflow.com",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 16.5h-12v-2h12v2z"/><path d="m19 20h-14v-2h14z"/><path d="m14 12 0.8-3-3-0.7-0.8 3 3 0.7z"/><path d="m12 8.3 1.6-2.7-2.7-1.6-1.6 2.7 2.7 1.6z"/><path d="m8.8 3.8 2.3-2.1-2.1-2.3-2.3 2.1 2.1 2.3z"/></svg>
      }
    ]
  }
];
