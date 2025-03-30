"use client";

import { motion } from "framer-motion";
import { useId } from "react";

// Define fixed positions for decorative elements to prevent hydration mismatch
const BUBBLE_POSITIONS = [
  { width: 135, height: 73, top: "30%", left: "15%" },
  { width: 220, height: 162, top: "79%", left: "28%" },
  { width: 165, height: 154, top: "14%", left: "42%" },
  { width: 146, height: 222, top: "87%", left: "37%" },
  { width: 98, height: 137, top: "78%", left: "30%" },
];

const FEATURE_BUBBLES = [
  { width: 325, height: 52, top: "53%", left: "12%", blur: "24px", radius: "24%" },
  { width: 227, height: 172, top: "37%", left: "0%", blur: "29px", radius: "47%" },
  { width: 285, height: 290, top: "21%", left: "86%", blur: "31px", radius: "16%" },
  { width: 166, height: 113, top: "27%", left: "46%", blur: "23px", radius: "82%" },
  { width: 167, height: 264, top: "7%", left: "29%", blur: "23px", radius: "1%" },
  { width: 158, height: 210, top: "87%", left: "26%", blur: "23px", radius: "97%" },
];

const TESTIMONIAL_BUBBLES = [
  { width: 253, height: 268, top: "35%", left: "64%", blur: "34px" },
  { width: 368, height: 273, top: "83%", left: "26%", blur: "39px" },
  { width: 363, height: 396, top: "10%", left: "70%", blur: "13px" },
  { width: 115, height: 169, top: "42%", left: "81%", blur: "22px" },
  { width: 262, height: 214, top: "57%", left: "21%", blur: "33px" },
  { width: 283, height: 249, top: "8%", left: "48%", blur: "39px" },
  { width: 218, height: 238, top: "57%", left: "85%", blur: "19px" },
  { width: 183, height: 293, top: "97%", left: "8%", blur: "14px" },
];

// Adding CTA bubbles with fixed positions to prevent hydration mismatch
const CTA_BUBBLES = [
  { width: 270, height: 144, top: "12%", left: "71%", blur: "27px" },
  { width: 231, height: 342, top: "81%", left: "69%", blur: "14px" },
  { width: 308, height: 256, top: "74%", left: "23%", blur: "18px" },
  { width: 339, height: 163, top: "27%", left: "48%", blur: "12px" },
  { width: 242, height: 332, top: "93%", left: "16%", blur: "30px" },
  { width: 232, height: 367, top: "8%", left: "59%", blur: "24px" },
  { width: 336, height: 279, top: "91%", left: "0%", blur: "35px" },
  { width: 234, height: 256, top: "66%", left: "60%", blur: "13px" },
];

export function HeroBubbles() {
  const id = useId();
  
  return (
    <>
      {BUBBLE_POSITIONS.map((bubble, index) => (
        <motion.div
          key={`${id}-hero-bubble-${index}`}
          className="absolute rounded-full"
          animate={{
            x: [0, 10, 0, -10, 0],
            y: [0, -10, 0, 10, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "loop",
            times: [0, 0.25, 0.5, 0.75, 1],
            ease: "easeInOut",
            delay: index * 0.3,
          }}
          style={{
            width: bubble.width,
            height: bubble.height,
            top: bubble.top,
            left: bubble.left,
          }}
        >
          <div
            className="absolute rounded-full bg-primary/10"
            style={{
              width: `${bubble.width}px`,
              height: `${bubble.height}px`,
              top: bubble.top,
              left: bubble.left,
            }}
          />
        </motion.div>
      ))}
    </>
  );
}

export function FeatureBubbles() {
  const id = useId();
  
  return (
    <>
      {FEATURE_BUBBLES.map((bubble, index) => (
        <motion.div
          key={`${id}-feature-bubble-${index}`}
          className="absolute rounded-full"
          animate={{
            x: [0, 15, 0, -15, 0],
            y: [0, -15, 0, 15, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "loop",
            times: [0, 0.25, 0.5, 0.75, 1],
            ease: "easeInOut",
            delay: index * 0.4,
          }}
          style={{
            width: bubble.width,
            height: bubble.height,
            top: bubble.top,
            left: bubble.left,
          }}
        >
          <div
            className="absolute rounded-full bg-primary/5"
            style={{
              width: `${bubble.width}px`,
              height: `${bubble.height}px`,
              borderRadius: bubble.radius,
              top: bubble.top,
              left: bubble.left,
              filter: `blur(${bubble.blur})`,
            }}
          />
        </motion.div>
      ))}
    </>
  );
}

export function TestimonialBubbles() {
  const id = useId();
  
  return (
    <>
      {TESTIMONIAL_BUBBLES.map((bubble, index) => (
        <motion.div
          key={`${id}-testimonial-bubble-${index}`}
          className="absolute blur-bubble"
          animate={{
            x: [0, 20, 0, -20, 0],
            y: [0, -20, 0, 20, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            repeatType: "loop",
            times: [0, 0.25, 0.5, 0.75, 1],
            ease: "easeInOut",
            delay: index * 0.5,
          }}
          style={{
            width: bubble.width,
            height: bubble.height,
            top: bubble.top,
            left: bubble.left,
          }}
        >
          <div
            className="absolute bg-white/5 rounded-full"
            style={{
              width: `${bubble.width}px`,
              height: `${bubble.height}px`,
              top: bubble.top,
              left: bubble.left,
              transform: "translate(-50%, -50%)",
              filter: `blur(${bubble.blur})`,
            }}
          />
        </motion.div>
      ))}
    </>
  );
}

export function CTABubbles() {
  const id = useId();
  
  return (
    <>
      {CTA_BUBBLES.map((bubble, index) => (
        <motion.div
          key={`${id}-cta-bubble-${index}`}
          className="absolute blur-bubble"
          animate={{
            x: [0, 15, 0, -15, 0],
            y: [0, -15, 0, 15, 0],
          }}
          transition={{
            duration: 20 + index * 2,
            repeat: Infinity,
            repeatType: "loop",
            times: [0, 0.25, 0.5, 0.75, 1],
            ease: "easeInOut",
            delay: index * 0.3,
          }}
          style={{
            width: bubble.width,
            height: bubble.height,
            top: bubble.top,
            left: bubble.left,
          }}
        >
          <div
            className="absolute bg-white/5 rounded-full"
            style={{
              width: `${bubble.width}px`,
              height: `${bubble.height}px`,
              top: bubble.top,
              left: bubble.left,
              transform: "translate(-50%, -50%)",
              filter: `blur(${bubble.blur})`,
            }}
          />
        </motion.div>
      ))}
    </>
  );
} 