document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tabs .tab');
  const currentPage = window.location.pathname.split('/').pop(); // e.g. "education.html"

  tabs.forEach(tab => {
    const href = tab.getAttribute('href');
    if (href === currentPage || (href === 'index.html' && currentPage === '')) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    } else {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    }
  });
});

// Canvas background animation (light particle + connect lines)
const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');
let w, h;
let particles = [];
function resize() {
  w = canvas.width = innerWidth;
  h = canvas.height = innerHeight;
}
window.addEventListener('resize', resize, { passive: true });
resize();

class Particle {
  constructor() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.r = 1 + Math.random() * 2;
  }
  step() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,220,255,0.12)';
    ctx.fill();
  }
}

function init(n=160) {
  particles = [];
  for (let i=0;i<n;i++) particles.push(new Particle());
}
init();

let mouse = { x: w/2, y: h/2, active: false };
canvas.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
canvas.addEventListener('mouseleave', () => { mouse.active = false; });

function draw() {
  ctx.clearRect(0,0,w,h);
  // subtle gradient base
  const g = ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#001226'); g.addColorStop(1,'#061320');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,h);

  for (let i=0;i<particles.length;i++) {
    const p = particles[i];
    p.step();
    p.draw();

    for (let j=i+1;j<particles.length;j++) {
      const q = particles[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const dist = Math.hypot(dx,dy);
      if (dist < 110) {
        ctx.beginPath();
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(q.x,q.y);
        ctx.strokeStyle = `rgba(150,190,255,${0.09 * (1 - dist/110)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (mouse.active) {
      const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
      const md = Math.hypot(mdx,mdy);
      if (md < 140) {
        ctx.beginPath();
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(mouse.x,mouse.y);
        ctx.strokeStyle = `rgba(170,200,255,${0.12 * (1 - md/140)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

// Controlled replay for showcase videos
function setupShowcasePlayback() {
  const anims = document.querySelectorAll('.card-anim');

  anims.forEach(video => {
    video.muted = true;
    video.loop = false;

    const delayAttr = video.dataset.repeatDelay || video.getAttribute('data-repeat-delay');
    const delay = parseInt(delayAttr, 10) || 2000;

    // Play once when metadata is ready
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(() => {
        // Autoplay might be blocked; user interaction may be required
      });
    });

    // Replay after delay when video ends
    video.addEventListener('ended', () => {
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
      }, delay);
    });

    // Pause when out of view to save resources
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (video.paused && !video.ended) {
            video.play().catch(() => {});
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
        }
      });
    }, { threshold: 0.25 });

    observer.observe(video);
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupShowcasePlayback);
} else {
  setupShowcasePlayback();
}
