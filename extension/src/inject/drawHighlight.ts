import type { HighlightAnnotation } from '../types';

/**
 * Passed directly to chrome.scripting.executeScript's `func` -- runs
 * standalone in the target page's context (Chrome serializes it via
 * toString() and re-executes there), so it must be fully self-contained:
 * no references to anything outside this function body, no helper
 * functions defined elsewhere in this file.
 *
 * Ported from src/components/shared/AnnotationMarker.tsx's circle/arrow
 * rendering -- that component can't run here (no React tree, no Tailwind
 * classes exist in this execution context) -- covering only 'circle'/
 * 'arrow' since ScreenAssistVisionService never produces anything else.
 * Rendered inside a Shadow DOM specifically so the host page's own CSS
 * can't override these generic-looking styles, and vice versa: this
 * marker can't leak `.label`/`.circle` etc. into the real page at all.
 */
export function drawHighlight(annotation: HighlightAnnotation): void {
  const HOST_ID = '__techsteps_highlight__';
  document.getElementById(HOST_ID)?.remove();

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText =
    `position:fixed; left:${annotation.x}vw; top:${annotation.y}vh; ` +
    `z-index:2147483647; pointer-events:none; transform:translate(-50%,-50%);`;

  const shadow = host.attachShadow({ mode: 'open' });
  const color = annotation.color || '#ef4444';
  const style = document.createElement('style');
  style.textContent = `
    .marker { position: relative; }
    .circle {
      width: 48px; height: 48px; border-radius: 9999px;
      border: 4px solid ${color};
      box-shadow: 0 0 20px ${color}66;
      animation: techsteps-pulse 1.5s ease-in-out infinite;
    }
    .arrow { width: 48px; height: 48px; color: ${color}; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4)); }
    .label {
      position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
      margin-top: 8px; padding: 6px 12px; border-radius: 8px;
      background: rgba(15,23,42,0.85); color: #fff; font: 600 14px sans-serif;
      white-space: nowrap;
    }
    @keyframes techsteps-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  `;
  shadow.appendChild(style);

  const marker = document.createElement('div');
  marker.className = 'marker';

  if (annotation.type === 'circle') {
    const circle = document.createElement('div');
    circle.className = 'circle';
    marker.appendChild(circle);
  } else {
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('class', 'arrow');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '3');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const line = document.createElementNS(svgNs, 'line');
    line.setAttribute('x1', '12'); line.setAttribute('y1', '19');
    line.setAttribute('x2', '12'); line.setAttribute('y2', '5');
    const poly = document.createElementNS(svgNs, 'polyline');
    poly.setAttribute('points', '5 12 12 5 19 12');
    svg.appendChild(line);
    svg.appendChild(poly);
    marker.appendChild(svg);
  }

  if (annotation.label) {
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = annotation.label;
    marker.appendChild(label);
  }

  shadow.appendChild(marker);
  document.documentElement.appendChild(host);

  // No persistent connection tells this page when the marker's gone stale,
  // so it fades itself out rather than sticking around forever.
  setTimeout(() => host.remove(), 6000);
}
