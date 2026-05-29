"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Atom, Zap, Brain, Database, Globe } from "lucide-react";

export function ParticleBackground() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 40; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
        });
      }
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  if (!mounted) return null;

  const ICONS = [Atom, Zap, Brain, Database, Globe];

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute bg-cyan-500/30 rounded-full blur-[1px]"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Floating Icons */}
      {ICONS.map((Icon, idx) => (
        <motion.div
          key={idx}
          className="absolute text-blue-500/20"
          style={{
            left: `${15 + idx * 20}%`,
            top: `${20 + (idx % 3) * 30}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 15 + idx * 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Icon size={64 + idx * 16} />
        </motion.div>
      ))}

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
    </div>
  );
}
