const DEFAULT_ENDPOINT = 'https://stuart-sanity-blog.vercel.app/api/add-link'

const endpointInput = document.getElementById('endpoint')
const apiKeyInput = document.getElementById('apiKey')
const saveSettingsBtn = document.getElementById('saveSettingsBtn')
const quickAddBtn = document.getElementById('quickAddBtn')
const statusEl = document.getElementById('status')

function setStatus(message, isError = false) {
  statusEl.textContent = message
  statusEl.style.color = isError ? '#fca5a5' : '#86efac'
}

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['endpoint', 'apiKey'], (result) => {
      resolve({
        endpoint: result.endpoint || DEFAULT_ENDPOINT,
        apiKey: result.apiKey || '',
      })
    })
  })
}

function saveSettings(endpoint, apiKey) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ endpoint, apiKey }, resolve)
  })
}

function getActiveTabUrl() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs?.[0]?.url
      if (!url || !(url.startsWith('http://') || url.startsWith('https://'))) {
        reject(new Error('Active tab does not have a valid HTTP(S) URL.'))
        return
      }
      resolve(url)
    })
  })
}

async function handleSaveSettings() {
  const endpoint = endpointInput.value.trim()
  const apiKey = apiKeyInput.value.trim()

  if (!endpoint || !apiKey) {
    setStatus('Endpoint and API key are required.', true)
    return
  }

  await saveSettings(endpoint, apiKey)
  setStatus('Settings saved.')
}

async function handleQuickAdd() {
  try {
    const endpoint = endpointInput.value.trim()
    const apiKey = apiKeyInput.value.trim()

    if (!endpoint || !apiKey) {
      setStatus('Set endpoint and API key first.', true)
      return
    }

    const tabUrl = await getActiveTabUrl()
    const target = `${endpoint}?url=${encodeURIComponent(tabUrl)}&key=${encodeURIComponent(apiKey)}`
    const res = await fetch(target, { method: 'GET' })
    const data = await res.json().catch(() => ({ error: 'Invalid JSON response' }))

    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`)
    }

    const note = data.duplicate ? 'Already saved.' : 'Saved to Inbox.'
    setStatus(`${note} ${data.title || tabUrl}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    setStatus(`Quick Add failed: ${message}`, true)
  }
}

async function init() {
  const settings = await getSettings()
  endpointInput.value = settings.endpoint
  apiKeyInput.value = settings.apiKey

  saveSettingsBtn.addEventListener('click', handleSaveSettings)
  quickAddBtn.addEventListener('click', handleQuickAdd)
}

init()
