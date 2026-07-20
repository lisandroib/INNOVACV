<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
}

const props = withDefaults(defineProps<{
  sparklesCount?: number;
  colors?: { first: string; second: string };
}>(), {
  sparklesCount: 10,
  colors: () => ({ first: '#9E7AFF', second: '#FE8BBB' })
})

const sparkles = ref<Sparkle[]>([])

const generateStar = (): Sparkle => {
  const starX = `${Math.random() * 110 - 5}%`; // Expands horizontal distribution slightly beyond the boundaries (-5% to 105%)
  const starY = `${Math.random() * 70 + 10}%`; // Constrains stars to 10%-80% height, keeping them inside text boundaries
  const color = Math.random() > 0.5 ? props.colors.first : props.colors.second;
  const delay = Math.random() * 2;
  const scale = Math.random() * 0.8 + 0.3; // Slightly reduced max size for a cleaner look
  const lifespan = Math.random() * 10 + 5;
  const id = `${starX}-${starY}-${Date.now()}-${Math.random()}`;
  return { id, x: starX, y: starY, color, delay, scale, lifespan };
}

let interval: number | any

onMounted(() => {
  // Inicializar sparkles
  sparkles.value = Array.from({ length: props.sparklesCount }, generateStar)

  // Actualizar la vida útil y regenerar cada 100ms
  interval = setInterval(() => {
    sparkles.value = sparkles.value.map((star) => {
      if (star.lifespan <= 0) {
        return generateStar()
      } else {
        return { ...star, lifespan: star.lifespan - 0.1 }
      }
    })
  }, 100)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div class="sparkles-container">
    <!-- Renderizar cada destello -->
    <svg
      v-for="sparkle in sparkles"
      :key="sparkle.id"
      class="sparkle-element"
      :style="{
        left: sparkle.x,
        top: sparkle.y,
        '--sparkle-scale': sparkle.scale,
        'animation-delay': `${sparkle.delay}s`
      }"
      width="21"
      height="21"
      viewBox="0 0 21 21"
    >
      <path
        d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
        :fill="sparkle.color"
      />
    </svg>

    <!-- Contenido original (título/logo) -->
    <slot></slot>
  </div>
</template>

<style scoped>
@keyframes sparkle-anim {
  0% {
    opacity: 0;
    transform: scale(0) rotate(75deg);
  }
  50% {
    opacity: 1;
    transform: scale(var(--sparkle-scale)) rotate(120deg);
  }
  100% {
    opacity: 0;
    transform: scale(0) rotate(150deg);
  }
}

.sparkles-container {
  display: inline-block;
  position: relative;
  width: fit-content;
  margin: 0 auto;
}

.sparkle-element {
  position: absolute;
  pointer-events: none;
  z-index: 20;
  animation: sparkle-anim 0.8s infinite ease-in-out;
  transform-origin: center;
}
</style>
