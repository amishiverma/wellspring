import React, { useEffect, useRef } from 'react';

interface GravFluxCanvasProps {
  className?: string;
  intensity?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
  orbitCenter: { x: number; y: number };
  angle: number;
  radius: number;
  speed: number;
}

interface GravityWell {
  x: number;
  y: number;
  mass: number;
  radius: number;
  color: string;
  pulse: number;
}

export const GravFluxCanvas: React.FC<GravFluxCanvasProps> = ({
  className = '',
  intensity = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 450;
    };

    window.addEventListener('resize', handleResize);

    // Mouse interactive gravity probe
    const mouse = {
      x: width * 0.5,
      y: height * 0.45,
      isHovered: false,
      targetX: width * 0.5,
      targetY: height * 0.45,
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.isHovered = true;
    };

    const onMouseLeave = () => {
      mouse.isHovered = false;
      mouse.targetX = width * 0.5;
      mouse.targetY = height * 0.45;
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    // Define 3 dynamic gravitational wells (representing Collection Swarm, Apex MRF, and Circular Bio-Sink)
    const wells: GravityWell[] = [
      { x: width * 0.2, y: height * 0.5, mass: 120, radius: 18, color: '#10b981', pulse: 0 },
      { x: width * 0.52, y: height * 0.4, mass: 220, radius: 26, color: '#00f0ff', pulse: 1.2 },
      { x: width * 0.82, y: height * 0.55, mass: 150, radius: 22, color: '#8b5cf6', pulse: 2.4 },
    ];

    // Initialize flow particles (representing waste quantum streams)
    const PARTICLE_COUNT = Math.min(180, Math.floor(width / 7));
    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const well = wells[i % wells.length];
      const radius = 30 + Math.random() * (width * 0.35);
      const angle = Math.random() * Math.PI * 2;
      particles.push({
        x: well.x + Math.cos(angle) * radius,
        y: well.y + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: 1.2 + Math.random() * 2.2,
        alpha: 0.2 + Math.random() * 0.7,
        hue: i % 3 === 0 ? 160 : i % 3 === 1 ? 186 : 265, // Emerald, Cyan, Violet
        orbitCenter: well,
        angle,
        radius,
        speed: (0.004 + Math.random() * 0.009) * (Math.random() > 0.5 ? 1 : -1),
      });
    }

    let time = 0;

    // Render loop
    const render = () => {
      time += 0.02 * intensity;

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Update wells position adaptively
      wells[0].x = width * 0.2;
      wells[0].y = height * 0.5 + Math.sin(time * 0.8) * 12;
      wells[1].x = width * 0.52;
      wells[1].y = height * 0.4 + Math.cos(time * 0.6) * 14;
      wells[2].x = width * 0.82;
      wells[2].y = height * 0.55 + Math.sin(time * 0.9) * 16;

      // Clear with subtle trail fade for silky motion
      ctx.fillStyle = 'rgba(7, 9, 14, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Draw faint vector grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw orbital potential flow rings around wells
      wells.forEach((well, idx) => {
        well.pulse = (well.pulse + 0.03) % (Math.PI * 2);
        const pulseR = well.radius + Math.sin(well.pulse) * 8;

        // Radial glow
        const grad = ctx.createRadialGradient(well.x, well.y, 4, well.x, well.y, well.radius * 3.5);
        grad.addColorStop(0, well.color + '40');
        grad.addColorStop(0.5, well.color + '10');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(well.x, well.y, well.radius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Well Core
        ctx.fillStyle = well.color;
        ctx.beginPath();
        ctx.arc(well.x, well.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Concentric flux ring
        ctx.strokeStyle = well.color + '33';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(well.x, well.y, pulseR * 1.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Interactive mouse attraction field
      if (mouse.isHovered) {
        const mouseGrad = ctx.createRadialGradient(mouse.x, mouse.y, 2, mouse.x, mouse.y, 110);
        mouseGrad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
        mouseGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = mouseGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 110, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw particles & gravitational curvature
      particles.forEach((p) => {
        // Orbit motion around its assigned well
        p.angle += p.speed * intensity;
        const targetX = p.orbitCenter.x + Math.cos(p.angle) * p.radius;
        const targetY = p.orbitCenter.y + Math.sin(p.angle) * p.radius * 0.55;

        // Apply slight spring velocity
        p.vx += (targetX - p.x) * 0.03;
        p.vy += (targetY - p.y) * 0.03;
        p.vx *= 0.92;
        p.vy *= 0.92;

        // Mouse perturbation
        const dxMouse = mouse.x - p.x;
        const dyMouse = mouse.y - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 140 && distMouse > 5) {
          const force = (140 - distMouse) / 140;
          p.vx += (dxMouse / distMouse) * force * 1.2;
          p.vy += (dyMouse / distMouse) * force * 1.2;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Draw particle
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Streamlines connecting closest particles
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i += 3) {
        for (let j = i + 1; j < Math.min(particles.length, i + 8); j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 48) {
            const alpha = (1 - dist / 48) * 0.2;
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [intensity]);

  return (
    <div className={`relative overflow-hidden pointer-events-auto ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
    </div>
  );
};
