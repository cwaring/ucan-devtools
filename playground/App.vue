<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/ui/button/Button.vue'
import Card from '@/components/ui/card/Card.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import CardDescription from '@/components/ui/card/CardDescription.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MOCK_DELEGATION_TOKEN, TOKEN_SCENARIOS } from '@/utils/mock-tokens'

const log = ref<string[]>([])
const selectedScenario = ref<string>('0')

function write(message: string) {
  log.value.push(`[${new Date().toLocaleTimeString()}] ${message}`)
}

async function sendRequest() {
  const scenario = TOKEN_SCENARIOS[Number.parseInt(selectedScenario.value, 10)]

  const headers = new Headers()
  if (scenario.authorizationHeader) {
    headers.set('Authorization', scenario.authorizationHeader)
  }
  if (scenario.ucansHeader) {
    headers.set('ucans', scenario.ucansHeader)
  }

  write(`Sending ${scenario.name}...`)

  try {
    const res = await fetch('https://httpbin.org/anything', {
      method: 'GET',
      headers,
    })
    write(`✓ Response: ${res.status} ${res.statusText}`)
  }
  catch (e) {
    write(`✗ Error: ${e}`)
  }
}

async function sendRandomRequest() {
  const headers = new Headers()
  headers.set('Authorization', `Bearer ${MOCK_DELEGATION_TOKEN}`)
  headers.set('ucans', `${MOCK_DELEGATION_TOKEN}, ${MOCK_DELEGATION_TOKEN}`)

  write('Sending random delegation tokens...')

  try {
    const res = await fetch('https://httpbin.org/anything', {
      method: 'GET',
      headers,
    })
    write(`✓ Response: ${res.status} ${res.statusText}`)
  }
  catch (e) {
    write(`✗ Error: ${e}`)
  }
}

function clearLog() {
  log.value = []
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b">
      <div class="max-w-5xl mx-auto px-6 py-8">
        <h1 class="text-3xl font-bold">
          UCAN Token Playground
        </h1>
        <p class="text-sm text-muted-foreground mt-2">
          Send mock UCAN tokens via network requests for the extension to capture
        </p>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Scenario Selection -->
        <Card>
          <CardHeader>
            <CardTitle>Test Scenarios</CardTitle>
            <CardDescription>
              Select a scenario and send a request
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">Scenario</label>
              <Select v-model="selectedScenario">
                <SelectTrigger class="w-full justify-between">
                  <SelectValue placeholder="Select a scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="(scenario, i) in TOKEN_SCENARIOS"
                    :key="i"
                    :value="String(i)"
                  >
                    {{ scenario.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="p-3 bg-muted rounded-md text-sm text-muted-foreground">
              {{ TOKEN_SCENARIOS[Number.parseInt(selectedScenario, 10)].description }}
            </div>

            <div class="flex gap-2">
              <Button @click="sendRequest">
                Send Request
              </Button>
              <Button variant="outline" @click="sendRandomRequest">
                Random
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Request Log -->
        <Card>
          <CardHeader>
            <CardTitle>Request Log</CardTitle>
            <CardDescription>
              Network activity
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="bg-muted rounded-md p-4 h-64 overflow-y-auto font-mono text-xs">
              <div v-if="log.length === 0" class="text-muted-foreground text-center py-8">
                No requests sent yet
              </div>
              <div v-for="(line, i) in log" :key="i" class="py-0.5">
                {{ line }}
              </div>
            </div>

            <Button variant="outline" class="w-full" @click="clearLog">
              Clear Log
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Instructions -->
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2 text-sm">
          <ol class="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Open the UCAN DevTools extension in your browser</li>
            <li>Select a test scenario from the dropdown above</li>
            <li>Click "Send Request" to emit a network request with UCAN tokens</li>
            <li>The extension will capture and display the token details</li>
            <li>Use "Random" to quickly test with delegation tokens</li>
          </ol>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
