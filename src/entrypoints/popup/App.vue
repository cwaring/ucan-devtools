<script lang="ts" setup>
import Button from '@/components/ui/button/Button.vue'
import Card from '@/components/ui/card/Card.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import CardDescription from '@/components/ui/card/CardDescription.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'

function closePopup() {
  window.close()
}
</script>

<template>
  <div class="min-h-screen p-4 bg-background text-foreground">
    <Card class="w-96 shadow-lg">
      <CardHeader>
        <CardTitle>UCAN Devtools</CardTitle>
        <CardDescription>
          Inspect and debug UCAN tokens
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-3">
          <div class="rounded-lg bg-muted p-4">
            <h3 class="font-semibold text-sm mb-2">
              How to use:
            </h3>
            <ol class="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open your browser's Developer Tools (or Inspector)</li>
              <li>Navigate to the "UCAN Devtools" panel tab</li>
              <li>Network requests with UCAN tokens will appear automatically</li>
              <li>Click "Inspect" to view token details</li>
            </ol>
          </div>
        </div>

        <Button
          class="w-full"
          @click="closePopup"
        >
          Got it, close this
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
