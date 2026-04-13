'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ZenitsuLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
}

// Deterministic seed values — same on server and client (no Math.random in render)
const SMOKE_SEEDS = [
  { delay: 0.4,  duration: 9.2,  x: 30,  y: -20, scale: 0.9,  opacity: 0.55 },
  { delay: 1.1,  duration: 10.5, x: -40, y: 25,  scale: 1.1,  opacity: 0.42 },
  { delay: 0.7,  duration: 8.8,  x: 20,  y: -35, scale: 0.85, opacity: 0.60 },
  { delay: 1.8,  duration: 11.2, x: -25, y: 40,  scale: 1.05, opacity: 0.38 },
  { delay: 0.3,  duration: 9.7,  x: 45,  y: -15, scale: 0.95, opacity: 0.50 },
  { delay: 1.5,  duration: 10.1, x: -30, y: 30,  scale: 1.0,  opacity: 0.45 },
  { delay: 0.9,  duration: 8.4,  x: 35,  y: -28, scale: 0.88, opacity: 0.58 },
  { delay: 1.3,  duration: 11.8, x: -15, y: 22,  scale: 1.08, opacity: 0.35 },
  { delay: 0.6,  duration: 9.4,  x: 28,  y: -42, scale: 0.92, opacity: 0.48 },
  { delay: 1.7,  duration: 10.8, x: -38, y: 18,  scale: 1.02, opacity: 0.52 },
  { delay: 0.2,  duration: 8.6,  x: 42,  y: -10, scale: 0.87, opacity: 0.44 },
  { delay: 1.0,  duration: 11.0, x: -20, y: 35,  scale: 1.06, opacity: 0.40 },
];

const SMOKE_PARTICLES = SMOKE_SEEDS.map((s, i) => ({ id: i, ...s }));

// Pre-computed spark positions (cos/sin of i*PI*2/6 for i=0..5)
/** Tiny placeholder so `placeholder="blur"` avoids layout jump (remote URL). */
const ZENITSU_BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc+UGdBV1lZWV1fWFlaY2Nja2NjY2P/2wBDAQ4QERQZKRIkZGRlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVl/wAARCAAFAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwB//9k='

const SPARK_POSITIONS = [
  { left: 250, top: 50   }, // i=0: cos=1,   sin=0
  { left: 150, top: 223  }, // i=1: cos=0.5, sin=0.866
  { left: -50, top: 223  }, // i=2: cos=-0.5,sin=0.866
  { left: -150,top: 50   }, // i=3: cos=-1,  sin=0
  { left: -50, top: -123 }, // i=4: cos=-0.5,sin=-0.866
  { left: 150, top: -123 }, // i=5: cos=0.5, sin=-0.866
];

export default function ZenitsuLoader({ isLoading, children }: ZenitsuLoaderProps) {
  const [showLoader, setShowLoader] = useState(true);
  const [exitAnimation, setExitAnimation] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setExitAnimation(true);
      // Remove loader after exit animation completes
      setTimeout(() => setShowLoader(false), 1200);
    }
  }, [isLoading]);

  const smokeParticles = SMOKE_PARTICLES;

  if (!showLoader) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        {showLoader && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="fixed inset-0 z-50 overflow-hidden"
          >
            {/* Dark Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />

            {/* Animated Smoke Layers */}
            <div className="absolute inset-0 overflow-hidden">
              {smokeParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute w-[800px] h-[800px] rounded-full"
                  style={{
                    background: `radial-gradient(circle, rgba(255, 200, 0, ${particle.opacity}) 0%, rgba(255, 150, 0, ${particle.opacity * 0.6}) 30%, transparent 70%)`,
                    filter: 'blur(80px)',
                    left: `${20 + (particle.id % 4) * 20}%`,
                    top: `${10 + Math.floor(particle.id / 4) * 30}%`,
                  }}
                  animate={
                    exitAnimation
                      ? {
                          opacity: 0,
                          y: -200,
                          scale: 0.5,
                        }
                      : {
                          x: [particle.x, -particle.x, particle.x],
                          y: [particle.y, -particle.y * 0.5, particle.y],
                          scale: [particle.scale, particle.scale * 1.1, particle.scale],
                          opacity: [particle.opacity, particle.opacity * 0.6, particle.opacity],
                        }
                  }
                  transition={
                    exitAnimation
                      ? { duration: 0.8, ease: 'easeInOut' }
                      : {
                          duration: particle.duration,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          ease: 'easeInOut',
                          delay: particle.delay,
                        }
                  }
                />
              ))}
            </div>

            {/* Additional Deep Smoke Layer */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(255, 180, 0, 0.15) 0%, transparent 60%)',
                filter: 'blur(120px)',
              }}
              animate={
                exitAnimation
                  ? { opacity: 0, scale: 2 }
                  : {
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }
              }
              transition={
                exitAnimation
                  ? { duration: 0.8 }
                  : {
                      duration: 6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
            />

            {/* Lightning Flash Effects */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={
                exitAnimation
                  ? { opacity: 0 }
                  : {
                      opacity: [0, 0.4, 0, 0, 0],
                    }
              }
              transition={
                exitAnimation
                  ? { duration: 0.3 }
                  : {
                      duration: 4,
                      repeat: Infinity,
                      times: [0, 0.1, 0.2, 0.3, 1],
                    }
              }
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent" />
            </motion.div>

            {/* Zenitsu Character */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={
                exitAnimation
                  ? {
                      x: '-40vw',
                      scale: 0.8,
                    }
                  : {
                      x: 0,
                      scale: 1,
                    }
              }
              transition={{
                duration: 1,
                ease: [0.43, 0.13, 0.23, 0.96], // Custom easing for smooth movement
              }}
            >
              {/* Glow Aura */}
              <motion.div
                className="absolute w-[500px] h-[500px] rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 200, 0, 0.4) 0%, rgba(255, 150, 0, 0.2) 40%, transparent 70%)',
                  filter: 'blur(60px)',
                }}
                animate={
                  exitAnimation
                    ? { opacity: 0, scale: 0.5 }
                    : {
                        scale: [1, 1.15, 1],
                        opacity: [0.6, 0.8, 0.6],
                      }
                }
                transition={
                  exitAnimation
                    ? { duration: 0.8 }
                    : {
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                }
              />

              {/* Electric Pulse Ring */}
              <motion.div
                className="absolute w-[450px] h-[450px] border-2 border-yellow-400/30 rounded-full"
                animate={
                  exitAnimation
                    ? { opacity: 0 }
                    : {
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5],
                      }
                }
                transition={
                  exitAnimation
                    ? { duration: 0.5 }
                    : {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }
                }
              />

              {/* Zenitsu Image Container */}
              <motion.div
                className="relative z-10"
                animate={
                  exitAnimation
                    ? {}
                    : {
                        y: [0, -10, 0],
                      }
                }
                transition={
                  exitAnimation
                    ? {}
                    : {
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                }
              >
                <div className="relative h-[min(70vw,400px)] w-[min(70vw,400px)] max-h-[400px] max-w-[400px]">
                  {/* Electric Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/20 via-orange-500/10 to-transparent rounded-full blur-2xl" />
                  
                  {/* Character Image — resized by Image API; blur reduces CLS */}
                  <Image
                    src="https://customer-assets.emergentagent.com/job_sculpture-shop-1/artifacts/rytzoe31_Zenitsu-PNG.png"
                    alt="Zenitsu"
                    width={400}
                    height={400}
                    sizes="(max-width: 480px) 70vw, 400px"
                    className="relative z-10 h-full w-full object-contain object-center drop-shadow-[0_0_30px_rgba(255,200,0,0.6)]"
                    placeholder="blur"
                    blurDataURL={ZENITSU_BLUR_DATA_URL}
                    priority
                  />
                </div>
              </motion.div>

              {/* Electricity Sparks — use pre-computed positions to avoid hydration mismatch */}
              {SPARK_POSITIONS.map((pos, i) => (
                <motion.div
                  key={`spark-${i}`}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    left: `${pos.left}px`,
                    top: `${pos.top}px`,
                  }}
                  animate={
                    exitAnimation
                      ? { opacity: 0 }
                      : {
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                        }
                  }
                  transition={
                    exitAnimation
                      ? { duration: 0.3 }
                      : {
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }
                  }
                />
              ))}
            </motion.div>

            {/* Loading Text (Optional) */}
            <motion.div
              className="absolute bottom-20 left-0 right-0 text-center"
              animate={
                exitAnimation
                  ? { opacity: 0, y: 20 }
                  : {
                      opacity: [0.5, 1, 0.5],
                    }
              }
              transition={
                exitAnimation
                  ? { duration: 0.5 }
                  : {
                      duration: 2,
                      repeat: Infinity,
                    }
              }
            >
              <p className="text-yellow-400 text-xl font-bold tracking-widest">
                THUNDER BREATHING
              </p>
              <div className="flex justify-center gap-1 mt-4">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-yellow-400 rounded-full"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Fades in from right */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={
          exitAnimation
            ? {
                opacity: 1,
                x: 0,
              }
            : {
                opacity: 0,
                x: 100,
              }
        }
        transition={{
          duration: 0.8,
          delay: 0.5,
          ease: 'easeOut',
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
