<script setup lang="ts">
import type { TokenItem } from './capture'
import { RotateCcw } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { captureFromRequest } from './capture'

const items = ref<TokenItem[]>([])

function resetRequests() {
  items.value = []
}

function truncate(s: string, n = 24) {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

function inspectUrl(token: string) {
  return `https://inspector.ucan.xyz/?ucan=${encodeURIComponent(token)}`
}

onMounted(() => {
  // CSS-only: initial theme handled via prefers-color-scheme in global styles

  const listener = (request: Browser.devtools.network.Request) => {
    const captured = captureFromRequest(request)
    if (captured.length)
      items.value = [...captured, ...items.value]
  }

  browser.devtools.network.onRequestFinished.addListener(listener)

  // initial HAR load
  browser.devtools.network.getHAR((harLog) => {
    const entries = harLog?.entries ?? []
    for (const entry of entries) {
      const captured = captureFromRequest(entry)
      if (captured.length)
        items.value = [...captured, ...items.value]
    }
  })

  onBeforeUnmount(() => {
    browser.devtools.network.onRequestFinished.removeListener(listener)
  })
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground p-4">
    <Card class="max-w-4xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle>UCAN Devtools</CardTitle>
        <CardDescription>
          Monitoring UCAN headers (Authorization: Bearer, ucans) captured from network requests.
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon" title="Clear all requests" @click="resetRequests">
            <RotateCcw class="size-4" />
          </Button>
        </CardAction>
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
            <TableRow v-for="(item, i) in items" :key="i">
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
                <Badge
                  :variant="
                    item.tokenType === 'invocation' ? 'default'
                    : item.tokenType === 'delegation' ? 'outline'
                      : item.tokenType === 'revocation' ? 'destructive'
                        : item.tokenType === 'promise' ? 'default'
                          : 'secondary'
                  "
                >
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
