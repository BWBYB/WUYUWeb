import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './ThreeHero.css'

export default function ThreeHero() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // State
    const state = {
      mouse: { x: 0, y: 0, target: { x: 0, y: 0 } },
      scroll: 0,
      clicked: false,
      clickTime: 0,
      time: 0
    }

    // Planet (sphere)
    const planetGeo = new THREE.SphereGeometry(1.2, 64, 64)
    const planetMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#6366f1') },
        uColor2: { value: new THREE.Color('#8b5cf6') },
        uColor3: { value: new THREE.Color('#06b6d4') },
        uClick: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float uTime;
        uniform float uClick;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;

          // Subtle vertex displacement
          vec3 pos = position;
          float wave = sin(pos.x * 3.0 + uTime) * 0.02;
          wave += sin(pos.y * 4.0 + uTime * 1.5) * 0.015;
          pos += normal * wave;

          // Click shockwave
          float clickWave = sin(length(pos.xy) * 10.0 - uClick * 5.0) * 0.05 * max(0.0, 1.0 - uClick * 0.5);
          pos += normal * clickWave;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform float uClick;

        void main() {
          // Gradient based on position
          float mixFactor = (vNormal.y + 1.0) * 0.5;
          vec3 color = mix(uColor1, uColor2, mixFactor);

          // Add third color based on x position
          float xFactor = abs(vNormal.x);
          color = mix(color, uColor3, xFactor * 0.4);

          // Fresnel glow at edges
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
          color += vec3(0.3, 0.4, 1.0) * fresnel;

          // Animated noise pattern
          float noise = sin(vPosition.x * 8.0 + uTime) * sin(vPosition.y * 8.0 + uTime * 0.7) * 0.1;
          color += noise;

          // Click flash
          float flash = max(0.0, 1.0 - uClick * 2.0) * 0.3;
          color += flash;

          gl_FragColor = vec4(color, 0.95);
        }
      `
    })
    const planet = new THREE.Mesh(planetGeo, planetMat)
    scene.add(planet)

    // Atmosphere glow
    const atmosphereGeo = new THREE.SphereGeometry(1.35, 64, 64)
    const atmosphereMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#8b5cf6') }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 uColor;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(uColor, intensity * 0.5);
        }
      `,
      transparent: true,
      side: THREE.BackSide
    })
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat)
    scene.add(atmosphere)

    // Orbital rings
    const rings = []
    const ringConfigs = [
      { radius: 1.8, tube: 0.008, color: '#6366f1', speed: 0.3, tilt: 0.3 },
      { radius: 2.1, tube: 0.006, color: '#8b5cf6', speed: -0.2, tilt: -0.4 },
      { radius: 2.4, tube: 0.005, color: '#06b6d4', speed: 0.15, tilt: 0.6 }
    ]

    ringConfigs.forEach(cfg => {
      const ringGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 100)
      const ringMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.6
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2 + cfg.tilt
      ring.userData = { speed: cfg.speed, baseTilt: cfg.tilt }
      scene.add(ring)
      rings.push(ring)
    })

    // Floating particles
    const particleCount = 300
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const radius = 2 + Math.random() * 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)

      velocities[i3] = (Math.random() - 0.5) * 0.002
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.002
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.002
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const particleMat = new THREE.PointsMaterial({
      color: '#8b5cf6',
      size: 0.02,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // Event handlers
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect()
      state.mouse.target.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      state.mouse.target.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    const handleClick = () => {
      state.clicked = true
      state.clickTime = 0
    }

    const handleScroll = () => {
      const rect = container.getBoundingClientRect()
      const viewHeight = window.innerHeight
      state.scroll = Math.max(0, Math.min(1, 1 - (rect.top / viewHeight)))
    }

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('click', handleClick)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)

    // Animation loop
    let lastTime = performance.now()
    let animationId = null
    let isVisible = true

    const animate = () => {
      if (!isVisible) {
        animationId = null
        return
      }

      const now = performance.now()
      const delta = (now - lastTime) / 1000
      lastTime = now
      state.time += delta

      // Smooth mouse follow
      state.mouse.x += (state.mouse.target.x - state.mouse.x) * 0.05
      state.mouse.y += (state.mouse.target.y - state.mouse.y) * 0.05

      // Update planet
      planetMat.uniforms.uTime.value = state.time
      planet.rotation.y += 0.003
      planet.rotation.x = state.mouse.y * 0.2

      // Click effect
      if (state.clicked) {
        state.clickTime += delta
        planetMat.uniforms.uClick.value = state.clickTime
        if (state.clickTime > 2) {
          state.clicked = false
          planetMat.uniforms.uClick.value = 0
        }
      }

      // Rings rotation
      rings.forEach(ring => {
        ring.rotation.z += ring.userData.speed * delta
        ring.rotation.x = Math.PI / 2 + ring.userData.baseTilt + state.mouse.y * 0.1
      })

      // Particles movement
      const posArray = particleGeo.attributes.position.array
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        posArray[i3] += velocities[i3]
        posArray[i3 + 1] += velocities[i3 + 1]
        posArray[i3 + 2] += velocities[i3 + 2]

        // Mouse influence
        posArray[i3] += state.mouse.x * 0.001
        posArray[i3 + 1] += state.mouse.y * 0.001

        // Boundary check
        const dist = Math.sqrt(posArray[i3] ** 2 + posArray[i3 + 1] ** 2 + posArray[i3 + 2] ** 2)
        if (dist > 5 || dist < 1.5) {
          velocities[i3] *= -1
          velocities[i3 + 1] *= -1
          velocities[i3 + 2] *= -1
        }
      }
      particleGeo.attributes.position.needsUpdate = true

      // Scroll effect - camera zoom
      const targetZ = 5 - state.scroll * 1.5
      camera.position.z += (targetZ - camera.position.z) * 0.1

      // Scene rotation based on mouse
      scene.rotation.y = state.mouse.x * 0.3
      scene.rotation.x = state.mouse.y * 0.2

      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }

    animate()
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible && animationId === null) {
        lastTime = performance.now()
        animate()
      }
      if (!isVisible && animationId !== null) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
    }, { threshold: 0.01 })
    visibilityObserver.observe(container)
    sceneRef.current = { scene, camera, renderer, state }

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      visibilityObserver.disconnect()
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('click', handleClick)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      planetGeo.dispose()
      planetMat.dispose()
      atmosphereGeo.dispose()
      atmosphereMat.dispose()
      rings.forEach(ring => {
        ring.geometry.dispose()
        ring.material.dispose()
      })
      particleGeo.dispose()
      particleMat.dispose()
      renderer.renderLists.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <section className="three-hero">
      <div className="three-hero-canvas" ref={containerRef}></div>
      <div className="three-hero-overlay">
        <div className="three-hero-content">
          <h2 className="three-hero-title">探索宇宙</h2>
          <p className="three-hero-subtitle">在代码与星辰之间，寻找无限可能</p>
        </div>
      </div>
      <div className="three-hero-hint">
        <span>移动鼠标 · 点击星球 · 滚动页面</span>
      </div>
    </section>
  )
}
