import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
  colors?: string[];
  particleCount?: number;
  duration?: number;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  life: number;
}

const celebrationMessages = [
  "🎉 Awesome job!",
  "✨ You're crushing it!",
  "🦷 Dentist approved!",
  "🌟 Brilliant work!",
  "💫 You nailed it!",
  "🎊 Fantastic!",
  "⚡ Superb!",
  "🚀 Outstanding!",
  "💎 Perfection!",
  "🏆 Champion!"
];

const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  trigger,
  onComplete,
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
  particleCount = 100,
  duration = 3000,
  message,
  size = 'md'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showMessage, setShowMessage] = useState(false);
  const [displayMessage, setDisplayMessage] = useState('');

  const sizeMultipliers = {
    sm: 0.7,
    md: 1,
    lg: 1.3
  };

  useEffect(() => {
    if (trigger) {
      initializeParticles();
      setDisplayMessage(message || celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]);
      setShowMessage(true);
      
      setTimeout(() => {
        setShowMessage(false);
        onComplete?.();
      }, duration);
    }
  }, [trigger]);

  const initializeParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 10 * sizeMultipliers[size],
        vy: Math.random() * -8 - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: (Math.random() * 6 + 3) * sizeMultipliers[size],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.3,
        life: 1.0
      });
    }
    
    setParticles(newParticles);
    animate(newParticles);
  };

  const animate = (currentParticles: Particle[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const updatedParticles = currentParticles
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + particle.gravity,
        rotation: particle.rotation + particle.rotationSpeed,
        life: particle.life - 0.01
      }))
      .filter(particle => 
        particle.life > 0 && 
        particle.y < canvas.height + 50 &&
        particle.x > -50 && 
        particle.x < canvas.width + 50
      );

    updatedParticles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.fillStyle = particle.color;
      
      // Draw different shapes
      const shapeType = Math.floor(particle.size) % 3;
      switch (shapeType) {
        case 0: // Circle
          ctx.beginPath();
          ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 1: // Square
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
          break;
        case 2: // Triangle
          ctx.beginPath();
          ctx.moveTo(0, -particle.size / 2);
          ctx.lineTo(-particle.size / 2, particle.size / 2);
          ctx.lineTo(particle.size / 2, particle.size / 2);
          ctx.closePath();
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });

    if (updatedParticles.length > 0) {
      animationRef.current = requestAnimationFrame(() => animate(updatedParticles));
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999
        }}
      />
      
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            transition={{ 
              type: "spring",
              damping: 15,
              stiffness: 300
            }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-2xl border border-gray-200">
              <motion.h2
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 12, stiffness: 400 }}
                className="text-2xl font-bold text-gray-800 text-center"
              >
                {displayMessage}
              </motion.h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConfettiCelebration;