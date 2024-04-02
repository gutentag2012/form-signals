<script setup>
const props = defineProps(['library'])
</script>

<template>
  <span :class="`library-chip ${library}`">{{ library }}</span>
</template>

<style scoped>
.library-chip {
  display: inline-block;
  padding: 0 0.5em;
  font-size: 0.85em;
  font-weight: 600;
  border-radius: 0.25em;
  color: #e0f2fe;
  background-color: #0c4a6e;
}
.form-core {
  color: #fecdd3;
  background-color: #881337;
}
.form-react {
  color: #dbeafe;
  background-color: #1e3a8a;
}
.form-react-native {
  color: #dbeafe;
  background-color: #1d4ed8;
}
.validation-adapter-zod {
  color: #ffedd5;
  background-color: #7c2d12;
}
.chore {
  color: #fef9c3;
  background-color: #713f12;
}
.addon-storage-persistence {
  color: #ccfbf1;
  background-color: #134e4a;
}
.debugger-react {
  color: #f3e8ff;
  background-color: #581c87;
}
</style>
