"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-6">About Budget Tracker</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
              <CardDescription>
                Empowering individuals and businesses to take control of their finances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Budget Tracker is designed to help you manage your finances effectively and achieve your financial goals.
                Our application provides intuitive tools for tracking expenses, creating budgets, and analyzing your 
                spending patterns.
              </p>
              <p>
                We believe that financial management should be accessible to everyone, regardless of their financial 
                background or expertise. Our goal is to simplify personal finance and provide you with the insights 
                you need to make informed financial decisions.
              </p>
              <p>
                Developed with modern web technologies, Budget Tracker offers a seamless and responsive experience 
                across all your devices.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="mr-2 text-primary">•</span>
                  <span>Expense tracking and categorization</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">•</span>
                  <span>Custom budget creation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">•</span>
                  <span>Financial analytics and reporting</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">•</span>
                  <span>Multi-currency support</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">•</span>
                  <span>Secure data storage</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">•</span>
                  <span>Cross-device synchronization</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Separator className="my-8" />
      
      <h2 className="text-2xl font-bold tracking-tight mb-6">Meet the Developer</h2>
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-primary/20 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full" />
              <Image 
                src="/developer-profile.svg" 
                alt="Addy Osmani" 
                width={144} 
                height={144} 
                className="object-cover"
                priority
              />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold">Addy Osmani</h3>
              <p className="text-muted-foreground mb-2">Engineering Leader at Google Chrome</p>
              
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                <Badge variant="secondary">JavaScript</Badge>
                <Badge variant="secondary">Web Performance</Badge>
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">NextJS</Badge>
              </div>
              
              <p className="mb-4">
                Addy Osmani is an Irish Software Engineer and leader currently working on the Google Chrome web browser. 
                With over 20 years of development experience, he has focused on making the web fast and better for users 
                and web developers. He is the author of several books including "Learning JavaScript Design Patterns", 
                "Leading Effective Engineering Teams", and "Image Optimization".
              </p>
              
              <div className="flex gap-3 justify-center md:justify-start">
                <Button asChild size="sm" variant="outline">
                  <Link href="https://addyosmani.com" target="_blank" rel="noopener noreferrer">
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
                    Website
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="https://github.com/addyosmani" target="_blank" rel="noopener noreferrer">
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
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                    GitHub
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="https://www.linkedin.com/in/addyosmani" target="_blank" rel="noopener noreferrer">
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
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground mb-4">
        © {new Date().getFullYear()} Budget Tracker. All rights reserved.
      </div>
    </div>
  );
} 