<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
      <div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div class="text-center">
          <h1 class="text-5xl font-bold text-gray-800 mb-4">
            Alfred Ordering
          </h1>
          <p class="text-xl text-gray-600 mb-8">
            Mobile Ordering App - MEVB Stack
          </p>

          <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8">
            <p class="font-bold">✓ Vue 3 is configured and running!</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-blue-50 p-6 rounded-lg">
              <h3 class="font-semibold text-blue-900 mb-2">Frontend</h3>
              <ul class="text-sm text-gray-700 space-y-1">
                <li>✓ Vue 3</li>
                <li>✓ Vite</li>
                <li>✓ Tailwind CSS</li>
                <li>✓ TypeScript</li>
              </ul>
            </div>

            <div class="bg-indigo-50 p-6 rounded-lg">
              <h3 class="font-semibold text-indigo-900 mb-2">Backend</h3>
              <ul class="text-sm text-gray-700 space-y-1">
                <li>✓ Express.js</li>
                <li>✓ Bun Runtime</li>
                <li>✓ MongoDB</li>
                <li>✓ Docker</li>
              </ul>
            </div>
          </div>

          <div class="bg-gray-100 rounded-lg p-6 mb-6">
            <h3 class="font-semibold text-gray-800 mb-3">API Status</h3>
            <div v-if="apiStatus === 'loading'" class="text-gray-600">
              Checking server connection...
            </div>
            <div v-else-if="apiStatus === 'connected'" class="text-green-600 font-semibold">
              ✓ Connected to server at {{ apiUrl }}
            </div>
            <div v-else class="text-orange-600">
              ⚠ Server not running. Start with: <code class="bg-white px-2 py-1 rounded">bun run dev</code>
            </div>
          </div>

          <div class="text-sm text-gray-500">
            <p>Ready to start building your ordering app!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
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