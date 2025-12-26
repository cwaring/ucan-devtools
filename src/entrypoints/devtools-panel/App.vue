<script setup lang="ts">
import type { TokenItem } from './capture'
import * as cborg from 'cborg'
import { RotateCcw } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { captureFromRequest } from './capture'

const items = ref<TokenItem[]>([])
const selectedRowIndex = ref<number | null>(null)
const payloadCache = new Map<string, string>()

const TYPE_VARIANTS = {
  invocation: 'default',
  delegation: 'outline',
} as const

function resetRequests() {
  items.value = []
  selectedRowIndex.value = null
  payloadCache.clear()
}

function toggleRowExpansion(index: number) {
  selectedRowIndex.value = selectedRowIndex.value === index ? null : index
}

function addTokens(captured: TokenItem[]) {
  if (captured.length)
    items.value = [...captured, ...items.value]
}

function getTypeVariant(tokenType: string) {
  return TYPE_VARIANTS[tokenType as keyof typeof TYPE_VARIANTS] ?? 'secondary'
}

function decodePayload(token: string): string {
  if (payloadCache.has(token))
    return payloadCache.get(token)!

  try {
    const bytes = Uint8Array.from(atob(token), c => c.charCodeAt(0))
    const decoded = cborg.decode(bytes)
    const result = JSON.stringify(toDagJson(decoded), null, 2)
    payloadCache.set(token, result)
    return result
  }
  catch (e) {
    return `Error: ${e instanceof Error ? e.message : 'Unknown error'}`
  }
}

function toDagJson(value: any): any {
  if (value instanceof Uint8Array)
    return { '/': { bytes: btoa(String.fromCharCode(...value)) } }

  if (Array.isArray(value))
    return value.map(toDagJson)

  if (value !== null && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toDagJson(v)]))

  return value
}

function truncate(s: string, n = 24) {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

function inspectUrl(token: string) {
  return `https://inspector.ucan.xyz/?ucan=${encodeURIComponent(token)}`
}

onMounted(() => {
  const listener = (request: Browser.devtools.network.Request) => addTokens(captureFromRequest(request))
  browser.devtools.network.onRequestFinished.addListener(listener)

  browser.devtools.network.getHAR((harLog) => {
    harLog?.entries?.forEach(entry => addTokens(captureFromRequest(entry)))
  })

  onBeforeUnmount(() => browser.devtools.network.onRequestFinished.removeListener(listener))
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground p-4">
    <Card class="max-w-4xl mx-auto shadow-sm">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>UCAN Devtools</CardTitle>
            <CardDescription>
              Monitoring UCAN headers (Authorization: Bearer, ucans) captured from network requests.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" title="Clear all requests" @click="resetRequests">
            <RotateCcw class="size-4" />
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Flat list of captured UCAN tokens.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Header</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Spec Version</TableHead>
              <TableHead>URL</TableHead>
              <TableHead class="text-center">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-for="(item, i) in items" :key="i">
              <TableRow
                :class="selectedRowIndex === i ? 'bg-muted' : 'hover:bg-muted/50'"
                class="cursor-pointer transition-colors"
                @click="toggleRowExpansion(i)"
              >
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger class="font-mono text-xs">
                        {{ truncate(item.token) }}
                      </TooltipTrigger>
                      <TooltipContent>
                        <div class="max-w-xs break-all font-mono text-xs">
                          {{ item.token }}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {{ item.header }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="item.format === 'container' ? 'default' : 'secondary'">
                    {{ item.format }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="getTypeVariant(item.tokenType)">
                    {{ item.tokenType }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span v-if="item.specVersion" class="font-mono text-xs text-muted-foreground">
                    {{ item.specVersion }}
                  </span>
                  <span v-else class="text-xs text-muted-foreground">
                    —
                  </span>
                </TableCell>
                <TableCell class="truncate max-w-[18rem]">
                  {{ item.url }}
                </TableCell>
                <TableCell class="flex justify-end items-center gap-2">
                  <Button variant="outline" size="sm" as-child>
                    <a :href="inspectUrl(item.token)" target="_blank">Inspect</a>
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow v-if="selectedRowIndex === i" class="hover:bg-transparent">
                <TableCell colspan="7" class="p-4">
                  <div class="space-y-2">
                    <h4 class="font-semibold text-sm">
                      Token Payload
                    </h4>
                    <pre class="bg-muted rounded p-3 overflow-auto text-xs font-mono text-muted-foreground max-h-64">{{ decodePayload(item.token) }}</pre>
                  </div>
                </TableCell>
              </TableRow>
            </template>
            <TableRow v-if="items.length === 0">
              <TableCell colspan="7" class="text-center text-sm text-muted-foreground">
                No UCAN headers captured yet.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
