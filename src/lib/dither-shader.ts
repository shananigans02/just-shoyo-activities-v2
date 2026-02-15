import * as THREE from "three";

/**
 * Blue dithered ASCII-style placeholder shader.
 * Creates a stylized loading effect while textures load.
 * Optimized for white backgrounds with smooth fade-in animation.
 */

// Vertex shader
const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader - creates animated dithered pattern with blue color
const fragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uFadeIn;

  varying vec2 vUv;

  // Blue color palette (indigo-ish for modern look)
  const vec3 colorLight = vec3(0.95, 0.96, 0.98);    // Near white bg
  const vec3 colorMid = vec3(0.7, 0.75, 0.9);        // Light blue
  const vec3 colorDark = vec3(0.4, 0.45, 0.85);      // Medium blue
  const vec3 colorAccent = vec3(0.3, 0.35, 0.95);    // Bright blue accent

  // Smooth noise function
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // Smoothstep

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Ordered dithering matrix (8x8 Bayer)
  float bayerMatrix(vec2 pos) {
    vec2 p = mod(pos, 8.0);
    float x = p.x;
    float y = p.y;

    // Simplified Bayer pattern
    float value = mod(x + y * 2.0, 4.0) / 4.0;
    value += mod(floor(x / 2.0) + floor(y / 2.0) * 2.0, 4.0) / 16.0;
    return value;
  }

  // Dot pattern for ASCII-like effect
  float dotPattern(vec2 uv, float size, float density) {
    vec2 cell = fract(uv * size);
    vec2 center = cell - 0.5;
    float dist = length(center);
    float radius = 0.35 * density;
    return smoothstep(radius + 0.05, radius - 0.05, dist);
  }

  // Cross/plus pattern
  float crossPattern(vec2 uv, float size, float density) {
    vec2 cell = fract(uv * size);
    vec2 center = abs(cell - 0.5);
    float thickness = 0.08 * density;
    float cross = min(
      smoothstep(thickness + 0.02, thickness, center.x),
      smoothstep(0.4, 0.2, center.y)
    ) + min(
      smoothstep(thickness + 0.02, thickness, center.y),
      smoothstep(0.4, 0.2, center.x)
    );
    return clamp(cross, 0.0, 1.0);
  }

  void main() {
    // Grid size for the dither pattern
    float gridSize = 24.0;
    vec2 grid = vUv * gridSize;

    // Animated wave pattern
    float wave1 = sin(grid.x * 0.5 + uTime * 1.5) * 0.5 + 0.5;
    float wave2 = sin(grid.y * 0.4 - uTime * 1.2) * 0.5 + 0.5;
    float wave3 = sin((grid.x + grid.y) * 0.3 + uTime * 0.8) * 0.5 + 0.5;

    // Combine waves for organic movement
    float wavePattern = (wave1 * wave2 + wave3) * 0.5;

    // Add subtle noise
    float n = noise(grid * 0.5 + uTime * 0.3);

    // Base density with radial gradient (center brighter)
    float dist = length(vUv - 0.5);
    float radialGradient = 1.0 - smoothstep(0.0, 0.7, dist);

    // Combine all effects
    float density = wavePattern * 0.6 + n * 0.3 + radialGradient * 0.3;
    density = clamp(density, 0.0, 1.0);

    // Apply Bayer dithering
    float dither = bayerMatrix(grid);
    float ditheredDensity = density + (dither - 0.5) * 0.2;
    ditheredDensity = clamp(ditheredDensity, 0.0, 1.0);

    // Create patterns based on density
    float dots = dotPattern(vUv, gridSize, ditheredDensity);
    float crosses = crossPattern(vUv, gridSize * 0.5, ditheredDensity);

    // Mix patterns based on density
    float pattern = mix(dots, crosses, smoothstep(0.3, 0.7, ditheredDensity));

    // Color mixing
    vec3 color = colorLight;
    color = mix(color, colorMid, pattern * 0.6);
    color = mix(color, colorDark, pattern * ditheredDensity * 0.5);

    // Add accent highlights on high density areas
    float highlight = smoothstep(0.6, 0.9, ditheredDensity) * pattern;
    color = mix(color, colorAccent, highlight * 0.3);

    // Subtle pulsing glow
    float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
    color += colorAccent * pulse * pattern * 0.05;

    // Soft edge fade
    float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x) *
                     smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);

    // Apply fade-in animation (smooth ease-out)
    float fadeInEased = 1.0 - pow(1.0 - uFadeIn, 3.0);

    // Final opacity
    float finalOpacity = uOpacity * edgeFade * fadeInEased;

    gl_FragColor = vec4(color, finalOpacity);
  }
`;

/**
 * Creates a dithered ASCII shader material.
 */
export function createDitherMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uFadeIn: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

/**
 * Updates the dither material time uniform for animation.
 */
export function updateDitherTime(
  material: THREE.ShaderMaterial,
  time: number
): void {
  if (material.uniforms.uTime) {
    material.uniforms.uTime.value = time;
  }
  // Animate fade-in over first 0.5 seconds
  if (material.uniforms.uFadeIn) {
    material.uniforms.uFadeIn.value = Math.min(1, time * 2);
  }
}

/**
 * Sets the dither material opacity.
 */
export function setDitherOpacity(
  material: THREE.ShaderMaterial,
  opacity: number
): void {
  if (material.uniforms.uOpacity) {
    material.uniforms.uOpacity.value = opacity;
  }
}
