"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

export default function AboutPage() {
  return (
    <motion.div 
      className="container max-w-5xl py-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">About Budget Buddy</h1>
        <p className="text-muted-foreground mb-8 text-lg">Your personal finance companion for financial freedom</p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <motion.div className="md:col-span-2" variants={itemVariants}>
          <Card className="h-full overflow-hidden shadow-md hover:shadow-lg transition-all hover:border-primary/50 duration-300">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M15 14c.2-1 .7-1.7 1.5-2"></path><path d="M8 9a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2"></path><path d="M17 9v9"></path><path d="M20 9h-6V5a2 2 0 1 1 4 0v6h4"></path></svg>
                Our Mission
              </CardTitle>
              <CardDescription>
                Empowering individuals and businesses to take control of their finances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p>
                Budget Buddy is designed to help you manage your finances effectively and achieve your financial goals.
                Our application provides intuitive tools for tracking expenses, creating budgets, and analyzing your 
                spending patterns.
              </p>
              <p>
                We believe that financial management should be accessible to everyone, regardless of their financial 
                background or expertise. Our goal is to simplify personal finance and provide you with the insights 
                you need to make informed financial decisions.
              </p>
              <p>
                Developed with modern web technologies, Budget Buddy offers a seamless and responsive experience 
                across all your devices, with a focus on security, performance, and user experience.
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="h-full shadow-md hover:shadow-lg transition-all hover:border-primary/50 duration-300">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path><path d="M15 8v7"></path><path d="M9 8v7"></path></svg>
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                {[
                  "Expense tracking and categorization",
                  "Custom budget creation and visualization",
                  "Financial analytics with multiple chart types",
                  "Multi-currency support",
                  "AI-powered financial insights",
                  "Dark & light theme support",
                  "Responsive mobile design"
                ].map((feature, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start rounded-md p-2 hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="mr-2 text-primary">•</span>
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <motion.div variants={itemVariants}>
        <Card className="mb-10 shadow-md hover:shadow-lg transition-all hover:border-primary/50 duration-300 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              App Details
            </CardTitle>
            <CardDescription>
              Latest updates and version information
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 bg-gradient-to-br from-primary to-primary/50 rounded-xl flex items-center justify-center shadow-md">
                  <Image 
                    src="/logo.svg" 
                    alt="Budget Buddy Logo" 
                    width={28} 
                    height={28} 
                    className="h-7 w-7 text-white" 
                  />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Budget Buddy</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Version 8.0</p>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Latest</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M16 12l-4 4-4-4"></path><path d="M12 16V2"></path></svg>
                  Released: May 1, 2025
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <motion.div 
                    className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg border border-primary/10"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <h5 className="text-sm font-medium mb-3 text-primary">Version 8.0 Key Updates</h5>
                    <ul className="text-sm space-y-2 text-muted-foreground ml-1">
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Completely redesigned analytics dashboard with 3D visualizations</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>New AI-powered financial advisor feature with personalized recommendations</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Advanced budget forecasting with predictive modeling</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Voice command integration for hands-free navigation and data entry</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Collaborative budget sharing for families and teams</span>
                      </li>
                    </ul>
                  </motion.div>
                  <motion.div 
                    className="p-4 rounded-lg border border-primary/10"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <h5 className="text-sm font-medium mb-3">Technical Improvements</h5>
                    <ul className="text-sm space-y-2 text-muted-foreground ml-1">
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Upgraded to Next.js 15.3 for improved performance and features</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Enhanced real-time data synchronization with Supabase</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Implemented server components for faster page loads</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Optimized codebase with React 19 features</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Added PWA capabilities for offline functionality</span>
                      </li>
                    </ul>
                  </motion.div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M16 12l-4 4-4-4"></path><path d="M12 16V2"></path></svg>
                  Previous Releases
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Version 7.3 (April 8, 2025)</h5>
                    <ul className="text-xs space-y-1.5 text-muted-foreground ml-1">
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Enhanced interactive dashboard with motion animations</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Smart color themes with automatic light/dark mode</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Haptic feedback for mobile interactions</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">Version 7.2 (April 5, 2025)</h5>
                    <ul className="text-xs space-y-1.5 text-muted-foreground ml-1">
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Dynamic data visualization with personalized insights</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Voice-controlled transaction entry</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1.5 text-primary">•</span>
                        <span>Multi-device synchronization with real-time updates</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-semibold mb-3">Technology Stack</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">Next.js 15.3</Badge>
                  <Badge variant="secondary" className="rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">React 19</Badge>
                  <Badge variant="secondary" className="rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">TypeScript 5.2</Badge>
                  <Badge variant="secondary" className="rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">Tailwind CSS</Badge>
                  <Badge variant="secondary" className="rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">Supabase</Badge>
                  <Badge variant="secondary" className="rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">Framer Motion</Badge>
                  <Badge variant="secondary" className="rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">Recharts</Badge>
                  <Badge variant="secondary" className="rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">TypeScript</Badge>
                  <Badge variant="secondary" className="rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">shadcn/ui</Badge>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 flex justify-between items-center">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Return to Dashboard
            </Link>
            <Link href="https://github.com/yourusername/budget-buddy" passHref>
              <Button variant="outline" size="sm" className="gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                GitHub
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-10">
        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Meet the Developer</span>
        </h2>
        
        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-primary/10 group">
          <CardContent className="p-0">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-80" />
              
              <div className="flex flex-col lg:flex-row items-center lg:items-stretch">
                {/* Developer Image Column */}
                <motion.div 
                  className="w-full lg:w-2/5 relative overflow-hidden h-[350px] lg:h-auto"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
                  
                  {/* Developer image */}
                  <img 
                    src="/1.png"
                    alt="Aditya Kumar Tiwari" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback to backup image if main image fails to load
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://raw.githubusercontent.com/itisaddy/Portfolio/main/assets/me-min.jpg";
                    }}
                  />
                  
                  <motion.div 
                    className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Badge className="bg-primary/90 text-white hover:bg-primary transition-colors shadow-md">
                      Cybersecurity
                    </Badge>
                    <Badge className="bg-primary/90 text-white hover:bg-primary transition-colors shadow-md">
                      Developer
                    </Badge>
                  </motion.div>
                </motion.div>
                
                {/* Developer Info Column */}
                <div className="w-full lg:w-3/5 p-6 lg:p-8 backdrop-blur-sm bg-card/95">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex flex-wrap gap-3 items-center mb-4">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5 }}
                          className="border border-primary/20 bg-primary/5 px-3 py-1 rounded-full text-xs font-medium text-primary uppercase tracking-wider"
                        >
                          Creator
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className="h-1.5 w-1.5 rounded-full bg-primary/50"
                        />
                        
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.15 }}
                          className="text-xs text-muted-foreground"
                        >
                          Available for freelance work
                        </motion.div>
                      </div>
                      
                      <motion.h3 
                        className="text-2xl lg:text-3xl font-bold mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        Aditya Kumar Tiwari
                      </motion.h3>
                      
                      <motion.p 
                        className="text-muted-foreground mb-4 flex flex-wrap items-center gap-x-4 gap-y-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="bg-primary/10 p-1.5 rounded-full shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                          </span>
                          <span className="font-medium">Cybersecurity Specialist</span>
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 hidden md:block"></span>
                        <span className="inline-flex items-center gap-2">
                          <span className="bg-primary/10 p-1.5 rounded-full shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                          </span>
                          <span className="font-medium">Sushant University</span>
                        </span>
                      </motion.p>
                      
                      <motion.div 
                        className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4 mb-6 border border-primary/10 shadow-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <h4 className="text-sm font-medium mb-2 text-primary">Key Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Python", "JavaScript", "React", "Next.js", "Tailwind CSS", "Linux"
                          ].map((skill, idx) => (
                            <motion.div
                              key={skill}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.4 + (idx * 0.05), duration: 0.3 }}
                              whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(var(--primary-rgb), 0.15)" }}
                            >
                              <Badge variant="secondary" className="bg-background hover:bg-primary/10 transition-colors duration-300 cursor-default shadow-sm">
                                {skill}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                      
                      <motion.p 
                        className="text-foreground/90 mb-6 leading-relaxed"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        Aditya is a passionate Cybersecurity Specialist and Full-Stack Developer currently pursuing a BCA in 
                        Cybersecurity. He thrives at the intersection of technology and innovation, 
                        crafting secure and scalable solutions for real-world challenges. His expertise spans Digital Forensics, 
                        Linux, Python, and web development technologies.
                      </motion.p>
                    </div>
                    
                    <motion.div 
                      className="flex flex-wrap gap-3 mt-auto"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      {[
                        { 
                          label: "Portfolio", 
                          href: "https://iaddy.netlify.app/", 
                          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10z" /></svg>,
                          color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
                        },
                        { 
                          label: "LinkedIn", 
                          href: "https://www.linkedin.com/in/itisaddy/", 
                          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>,
                          color: "bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 border-blue-600/20"
                        },
                        { 
                          label: "Instagram", 
                          href: "https://www.instagram.com/i__aditya7/", 
                          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
                          color: "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 border-pink-500/20"
                        },
                        { 
                          label: "Email", 
                          href: "mailto:itisaddy7@gmail.com", 
                          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
                          color: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                        }
                      ].map((link, i) => (
                        <motion.div 
                          key={link.label}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="shadow-sm"
                        >
                          <Button 
                            asChild 
                            variant="outline" 
                            size="sm" 
                            className={`gap-2 rounded-full border backdrop-blur-sm transition-all duration-300 ${link.color}`}
                          >
                            <Link href={link.href} target="_blank" rel="noopener noreferrer">
                              <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ delay: 1 + (i * 0.5), duration: 0.6, repeat: Infinity, repeatDelay: 5 }}>
                                {link.icon}
                              </motion.span>
                              {link.label}
                            </Link>
                          </Button>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 lg:p-8 bg-gradient-to-b from-card/40 to-card/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 pb-2 border-b border-primary/10">
                    <div className="bg-primary/10 p-1.5 rounded-md shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    </div>
                    Professional Experience
                  </h4>
                  <div className="space-y-4">
                    <motion.div 
                      className="p-4 rounded-lg border border-primary/10 bg-card/90 hover:bg-card hover:shadow-md transition-all duration-300 group relative overflow-hidden"
                      whileHover={{ y: -2, boxShadow: "0 10px 30px -15px rgba(var(--primary-rgb), 0.15)" }}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-90 rounded-l" />
                      <div className="pl-3">
                        <div className="font-medium group-hover:text-primary transition-colors">Mentor (Part-time)</div>
                        <div className="text-sm text-muted-foreground">JhaMobii Technologies Pvt. Ltd., Remote</div>
                        <div className="inline-block text-xs text-blue-500 mb-2 bg-blue-500/10 px-2 py-0.5 rounded-full mt-1">Aug 2025 - Present</div>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-start">
                            <span className="mr-1.5 text-primary">•</span>
                            <span>Provided technical mentorship in cybersecurity</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-1.5 text-primary">•</span>
                            <span>Guided team members through vulnerability assessments</span>
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="p-4 rounded-lg border border-primary/10 bg-card/90 hover:bg-card hover:shadow-md transition-all duration-300 group relative overflow-hidden"
                      whileHover={{ y: -2, boxShadow: "0 10px 30px -15px rgba(var(--primary-rgb), 0.15)" }}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-500 opacity-90 rounded-l" />
                      <div className="pl-3">
                        <div className="font-medium group-hover:text-primary transition-colors">Cybersecurity Intern</div>
                        <div className="text-sm text-muted-foreground">Null, Remote</div>
                        <div className="inline-block text-xs text-green-500 mb-2 bg-green-500/10 px-2 py-0.5 rounded-full mt-1">Jun 2025 - Present</div>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-start">
                            <span className="mr-1.5 text-primary">•</span>
                            <span>Conducted vulnerability assessments</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-1.5 text-primary">•</span>
                            <span>Monitored network traffic and responded to security incidents</span>
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 pb-2 border-b border-primary/10">
                    <div className="bg-primary/10 p-1.5 rounded-md shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    </div>
                    Certifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: "Foundations of Cybersecurity", color: "from-blue-500 to-indigo-500" },
                      { name: "Cyber Threat Management", color: "from-red-500 to-pink-500" },
                      { name: "OSForensics Triage", color: "from-green-500 to-emerald-500" },
                      { name: "Endpoint Security", color: "from-yellow-500 to-amber-500" },
                      { name: "ISO 27001", color: "from-purple-500 to-violet-500" },
                      { name: "Ethical Hacker", color: "from-teal-500 to-cyan-500" }
                    ].map((cert, idx) => (
                      <motion.div
                        key={cert.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.4, 
                          delay: 0.4 + (idx * 0.05)
                        }}
                        whileHover={{ scale: 1.05, y: -2, boxShadow: "0 10px 25px -10px rgba(var(--primary-rgb), 0.3)" }}
                        className="flex items-center"
                      >
                        <Badge className={`w-full py-2.5 px-3 rounded-lg border shadow-sm justify-center transition-all duration-300 bg-gradient-to-r ${cert.color} text-white font-medium`}>
                          {cert.name}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card className="shadow-md hover:shadow-lg transition-all hover:border-primary/50 duration-300">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Our Team
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4">
              Budget Buddy is developed by a passionate team of developers, designers, and financial experts dedicated to making personal finance management accessible and engaging for everyone.
            </p>
            <div className="flex justify-center my-4">
              <Button variant="default" className="rounded-full">
                Meet the Team
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all hover:border-primary/50 duration-300">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><circle cx="12" cy="10" r="2"></circle><line x1="8" y1="2" x2="8" y2="4"></line><line x1="16" y1="2" x2="16" y2="4"></line></svg>
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4">
              Have questions, suggestions, or feedback? We'd love to hear from you! Reach out to our support team for prompt assistance.
            </p>
            <div className="flex justify-center my-4">
              <Button variant="default" className="rounded-full">
                Get in Touch
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
} 