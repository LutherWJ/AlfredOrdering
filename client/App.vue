<template>
  <router-view/>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const apiUrl = ref('http://localhost:3000')
const apiStatus = ref<'loading' | 'connected' | 'disconnected'>('loading')

onMounted(async () => {
  try {
    const response = await fetch(`${apiUrl.value}/health`)
    if (response.ok) {
      apiStatus.value = 'connected'
    } else {
      apiStatus.value = 'disconnected'
    }
  } catch (error) {
    apiStatus.value = 'disconnected'
  }
})
</script>
