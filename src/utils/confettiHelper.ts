import confetti from 'canvas-confetti';

export const triggerBeautifulConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };
    
    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }
    
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
    
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
    
      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFC700', '#FF0000', '#2E3191', '#ffffff', '#41B6E6']
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFC700', '#FF0000', '#2E3191', '#ffffff', '#41B6E6']
      });
    }, 250);
};

export const triggerSchoolPride = () => {
    const end = Date.now() + (3 * 1000);
    const colors = ['#bb0000', '#ffffff', '#ffd700'];

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
            zIndex: 10000
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
            zIndex: 10000
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
};

export const triggerRealisticConfetti = () => {
    const count = 250;
    const defaults = { origin: { y: 0.7 }, zIndex: 10000 };

    function fire(particleRatio: number, opts: any) {
        confetti(Object.assign({}, defaults, opts, {
            particleCount: Math.floor(count * particleRatio)
        }));
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
};
