<script setup lang="ts">
/**
 * EditorBar - the floating Apotome control for the in-situ editor.
 *
 * An ink pill fixed bottom-center: tricolor slashes, mono labels, a
 * cobalt save state. Sign in with portal credentials, flip Edit on,
 * click any text on the page and type. Save a draft or publish.
 */
import { reactive, ref } from 'vue'
import { useContentEditor } from './useContentEditor'

const editor = useContentEditor()
const login = reactive({ email: '', password: '' })
const busy = ref(false)
const err = ref('')
const collapsed = ref(false)

async function submit() {
  if (busy.value) return
  busy.value = true
  err.value = ''
  try {
    await editor.signIn(login.email, login.password)
    login.password = ''
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Sign in failed'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="apk-bar" :class="{ collapsed }">
    <button v-if="collapsed" class="apk-expand" type="button" title="Apotome editor" @click="collapsed = false">
      <span class="apk-slash c">/</span><span class="apk-slash s">/</span><span class="apk-slash r">/</span>
    </button>

    <template v-else>
      <span class="apk-mark" aria-hidden="true">
        <span class="apk-slash c">/</span><span class="apk-slash s">/</span><span class="apk-slash r">/</span>
      </span>

      <!-- signed out: credentials -->
      <form v-if="!editor.authed.value" class="apk-login" @submit.prevent="submit">
        <input v-model="login.email" class="apk-input" type="email" placeholder="EMAIL" required autocomplete="email" />
        <input v-model="login.password" class="apk-input" type="password" placeholder="PASSWORD" required autocomplete="current-password" />
        <button class="apk-btn solid" type="submit" :disabled="busy">{{ busy ? 'SIGNING IN' : 'SIGN IN' }}</button>
        <span v-if="err" class="apk-msg bad">{{ err }}</span>
      </form>

      <!-- signed in: edit controls -->
      <template v-else>
        <button class="apk-btn" :class="{ on: editor.editMode.value }" type="button" @click="editor.toggle()">
          {{ editor.editMode.value ? 'EDITING' : 'EDIT' }}
        </button>
        <span v-if="editor.dirty.value.size" class="apk-count">{{ editor.dirty.value.size }} CHANGED</span>
        <button
          class="apk-btn"
          type="button"
          :disabled="editor.saving.value || !editor.dirty.value.size"
          @click="editor.save(false)"
        >
          SAVE DRAFT
        </button>
        <button
          class="apk-btn solid"
          type="button"
          :disabled="editor.saving.value || !editor.dirty.value.size"
          @click="editor.save(true)"
        >
          {{ editor.saving.value ? 'WORKING' : 'PUBLISH' }}
        </button>
        <span v-if="editor.saveMsg.value" class="apk-msg">{{ editor.saveMsg.value }}</span>
        <button class="apk-quiet" type="button" title="Sign out" @click="editor.signOut()">EXIT</button>
      </template>

      <button class="apk-quiet" type="button" title="Collapse" @click="collapsed = true">—</button>
    </template>
  </div>
</template>

<style>
/* global (unscoped): editable affordances injected into the host page */
.apk-editable {
  outline: 1px dashed rgba(36, 71, 232, 0.55);
  outline-offset: 2px;
  cursor: text;
  transition: outline-color 0.15s ease;
}

.apk-editable:hover,
.apk-editable:focus {
  outline: 2px solid #2447e8;
}

.apk-editable-img {
  outline: 1px dashed rgba(36, 71, 232, 0.55);
  outline-offset: 2px;
}

.apk-img-overlay {
  position: fixed;
  z-index: 2147483000;
  display: none;
  transform: translate(-50%, -50%);
  align-items: center;
  padding: 9px 16px;
  border: 0;
  background: #0a0a0a;
  color: #f2f0eb;
  font: 600 11px/1 ui-monospace, 'JetBrains Mono', Consolas, monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}
</style>

<style scoped>
.apk-bar {
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483001;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #0a0a0a;
  color: #f2f0eb;
  padding: 10px 14px;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.45);
  font-family: ui-monospace, 'JetBrains Mono', Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  max-width: calc(100vw - 24px);
  flex-wrap: wrap;
}

.apk-bar.collapsed {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.apk-expand {
  background: #0a0a0a;
  border: 0;
  padding: 10px 13px;
  cursor: pointer;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.apk-mark {
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 1px;
}

.apk-slash.c { color: #2447e8; }
.apk-slash.s { color: #ffc900; }
.apk-slash.r { color: #ff3d00; }

.apk-login {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.apk-input {
  background: transparent;
  border: 1px solid rgba(242, 240, 235, 0.3);
  color: #f2f0eb;
  padding: 7px 10px;
  font: inherit;
  width: 150px;
}

.apk-input::placeholder {
  color: rgba(242, 240, 235, 0.4);
}

.apk-input:focus {
  outline: none;
  border-color: #2447e8;
}

.apk-btn {
  background: transparent;
  border: 1px solid rgba(242, 240, 235, 0.35);
  color: #f2f0eb;
  padding: 7px 12px;
  font: inherit;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.apk-btn:hover:not(:disabled) {
  border-color: #f2f0eb;
}

.apk-btn.on {
  background: #2447e8;
  border-color: #2447e8;
}

.apk-btn.solid {
  background: #f2f0eb;
  border-color: #f2f0eb;
  color: #0a0a0a;
}

.apk-btn.solid:hover:not(:disabled) {
  background: #2447e8;
  border-color: #2447e8;
  color: #f2f0eb;
}

.apk-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.apk-count {
  color: #ffc900;
}

.apk-msg {
  color: #7f9cff;
}

.apk-msg.bad {
  color: #ff8a66;
}

.apk-quiet {
  background: none;
  border: 0;
  color: rgba(242, 240, 235, 0.5);
  font: inherit;
  cursor: pointer;
  padding: 4px;
}

.apk-quiet:hover {
  color: #f2f0eb;
}
</style>
