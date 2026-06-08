import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import crypto from 'node:crypto'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import fs from 'node:fs'
import { Buffer } from 'node:buffer'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin, ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import browserslistToEsbuild from 'browserslist-to-esbuild'

import { createVercelOutputPlugin } from './vercel-output-plugin.js'

const resolve = (dir: string) => path.join(__dirname, dir)
const cdpCallbackOriginEnv = 'VITE_ACCOUNT_WEB_CDP_CALLBACK_ORIGIN'

interface CDPCommand {
  id: number
  method: string
  params?: Record<string, unknown>
}

interface CDPEvent {
  method: string
  params?: Record<string, unknown>
}

interface CDPRequestPausedParams {
  requestId: string
  request: {
    url: string
    method: string
    headers: Record<string, string>
    postData?: string
  }
}

class CDPWebSocket {
  private socket: net.Socket
  private buffer = Buffer.alloc(0)
  private nextID = 1
  private eventListeners = new Map<string, Array<(params: Record<string, unknown>) => void>>()

  private constructor(socket: net.Socket) {
    this.socket = socket
    socket.on('data', (chunk) => this.handleData(chunk))
  }

  static async connect(rawURL: string) {
    const url = new URL(rawURL)
    const socket = await connectSocket(url.hostname, Number(url.port || 80))
    const key = crypto.randomBytes(16).toString('base64')
    socket.write(
      [
        `GET ${url.pathname}${url.search} HTTP/1.1`,
        `Host: ${url.host}`,
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Key: ${key}`,
        'Sec-WebSocket-Version: 13',
        '',
        ''
      ].join('\r\n')
    )

    await readHandshake(socket)
    return new CDPWebSocket(socket)
  }

  on(event: string, listener: (params: Record<string, unknown>) => void) {
    const listeners = this.eventListeners.get(event) ?? []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  send(method: string, params?: Record<string, unknown>) {
    const command: CDPCommand = { id: this.nextID++, method, params }
    this.socket.write(encodeWebSocketFrame(JSON.stringify(command)))
  }

  close() {
    this.socket.end()
  }

  private handleData(chunk: Buffer) {
    this.buffer = Buffer.concat([this.buffer, chunk])
    while (this.buffer.length > 0) {
      const frame = decodeWebSocketFrame(this.buffer)
      if (frame == null) return
      this.buffer = this.buffer.subarray(frame.length)
      const message = JSON.parse(frame.payload.toString()) as CDPEvent
      if (message.method == null || message.params == null) continue
      for (const listener of this.eventListeners.get(message.method) ?? []) listener(message.params)
    }
  }
}

function connectSocket(host: string, port: number) {
  return new Promise<net.Socket>((resolveSocket, reject) => {
    const socket = net.connect(port, host)
    socket.once('connect', () => resolveSocket(socket))
    socket.once('error', reject)
  })
}

function readHandshake(socket: net.Socket) {
  return new Promise<void>((resolveHandshake, reject) => {
    let buffer = Buffer.alloc(0)
    const onData = (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk])
      if (!buffer.includes('\r\n\r\n')) return
      socket.off('data', onData)
      resolveHandshake()
    }
    socket.on('data', onData)
    socket.once('error', reject)
  })
}

function encodeWebSocketFrame(payload: string) {
  const payloadBuffer = Buffer.from(payload)
  const mask = crypto.randomBytes(4)
  const headerLength = payloadBuffer.length < 126 ? 6 : 8
  const frame = Buffer.alloc(headerLength + payloadBuffer.length)
  frame[0] = 0x81
  if (payloadBuffer.length < 126) {
    frame[1] = 0x80 | payloadBuffer.length
    mask.copy(frame, 2)
  } else {
    frame[1] = 0x80 | 126
    frame.writeUInt16BE(payloadBuffer.length, 2)
    mask.copy(frame, 4)
  }
  const maskOffset = headerLength - 4
  for (let i = 0; i < payloadBuffer.length; i++) {
    frame[headerLength + i] = payloadBuffer[i] ^ frame[maskOffset + (i % 4)]
  }
  return frame
}

function decodeWebSocketFrame(buffer: Buffer): { length: number; payload: Buffer } | null {
  if (buffer.length < 2) return null
  const baseLength = buffer[1] & 0x7f
  let offset = 2
  let payloadLength = baseLength
  if (baseLength === 126) {
    if (buffer.length < 4) return null
    payloadLength = buffer.readUInt16BE(2)
    offset = 4
  } else if (baseLength === 127) {
    if (buffer.length < 10) return null
    payloadLength = Number(buffer.readBigUInt64BE(2))
    offset = 10
  }
  const masked = (buffer[1] & 0x80) !== 0
  const maskOffset = offset
  if (masked) offset += 4
  const length = offset + payloadLength
  if (buffer.length < length) return null
  const payload = Buffer.from(buffer.subarray(offset, length))
  if (masked) {
    for (let i = 0; i < payload.length; i++) payload[i] ^= buffer[maskOffset + (i % 4)]
  }
  return { length, payload }
}

function accountWebCDPCallbackPlugin(callbackOrigin: string | null): Plugin | null {
  if (callbackOrigin == null) return null

  return {
    name: 'account-web-cdp-callback-redirect',
    apply: 'serve',
    configureServer(server) {
      let chrome: ChildProcess | null = null
      let cdp: CDPWebSocket | null = null
      server.httpServer?.once('listening', () => {
        void startCDPCallbackRedirect(server, callbackOrigin)
          .then((result) => {
            chrome = result.chrome
            cdp = result.cdp
          })
          .catch((error: unknown) => {
            server.config.logger.error(
              `Failed to start Account Web CDP callback redirect: ${error instanceof Error ? error.message : String(error)}`
            )
          })
      })
      server.httpServer?.once('close', () => {
        cdp?.close()
        chrome?.kill()
      })
    }
  }
}

async function startCDPCallbackRedirect(server: ViteDevServer, callbackOrigin: string) {
  const devOrigin = server.resolvedUrls?.local[0]?.replace(/\/$/, '') ?? `http://localhost:${server.config.server.port}`
  const remoteDebuggingPort = await getFreePort()
  const chrome = launchChrome(remoteDebuggingPort, devOrigin)
  const target = await waitForCDPTarget(remoteDebuggingPort)
  const cdp = await CDPWebSocket.connect(target.webSocketDebuggerUrl)
  const callbackURLPattern = `${callbackOrigin.replace(/\/$/, '')}/api/identity-providers/*/callback*`

  cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: callbackURLPattern, requestStage: 'Request' }]
  })
  cdp.on('Fetch.requestPaused', (params) => {
    handlePausedCallbackRequest(cdp, params as unknown as CDPRequestPausedParams, devOrigin)
  })
  server.config.logger.info(`Account Web CDP callback redirect enabled for ${callbackURLPattern}`)
  return { chrome, cdp }
}

function launchChrome(remoteDebuggingPort: number, devOrigin: string) {
  const executable = findChromeExecutable()
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xbuilder-account-web-chrome-'))
  return spawn(
    executable,
    [
      `--remote-debugging-port=${remoteDebuggingPort}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      devOrigin
    ],
    { stdio: 'ignore' }
  )
}

function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH ?? null,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'google-chrome',
    'chromium',
    'chromium-browser'
  ]
  const executable = candidates.find(
    (candidate) => candidate != null && (candidate.includes('/') ? fs.existsSync(candidate) : true)
  )
  if (executable == null) throw new Error('Chrome executable not found')
  return executable
}

function getFreePort() {
  return new Promise<number>((resolvePort, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => {
        if (address == null || typeof address === 'string') {
          reject(new Error('Failed to allocate a remote debugging port'))
          return
        }
        resolvePort(address.port)
      })
    })
  })
}

async function waitForCDPTarget(port: number) {
  for (let i = 0; i < 50; i++) {
    const targets = await readJSON<Array<{ type: string; webSocketDebuggerUrl: string }>>(
      `http://127.0.0.1:${port}/json/list`
    ).catch(() => null)
    const target = targets?.find((item) => item.type === 'page' && item.webSocketDebuggerUrl != null)
    if (target != null) return target
    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 100))
  }
  throw new Error('Timed out waiting for Chrome DevTools Protocol target')
}

function readJSON<T>(url: string) {
  return new Promise<T>((resolveJSON, reject) => {
    http
      .get(url, (response) => {
        const chunks: Buffer[] = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => {
          resolveJSON(JSON.parse(Buffer.concat(chunks).toString()) as T)
        })
      })
      .on('error', reject)
  })
}

function handlePausedCallbackRequest(cdp: CDPWebSocket, params: CDPRequestPausedParams, devOrigin: string) {
  const requestURL = new URL(params.request.url)
  const provider = requestURL.pathname.match(/\/api\/identity-providers\/([^/]+)\/callback$/)?.[1]
  if (provider == null) {
    cdp.send('Fetch.continueRequest', { requestId: params.requestId })
    return
  }

  const target = new URL(`/api/identity-providers/${provider}/callback`, devOrigin)
  for (const [key, value] of requestURL.searchParams) target.searchParams.append(key, value)
  if (params.request.method === 'POST' && params.request.postData != null) {
    for (const [key, value] of new URLSearchParams(params.request.postData)) target.searchParams.append(key, value)
  }
  cdp.send('Fetch.fulfillRequest', {
    requestId: params.requestId,
    responseCode: 302,
    responseHeaders: [
      { name: 'Location', value: target.toString() },
      { name: 'Cache-Control', value: 'no-store' }
    ]
  })
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const vercelProxiedApiBaseURL =
    env.VITE_VERCEL_PROXIED_API_BASE_URL == null ? null : env.VITE_VERCEL_PROXIED_API_BASE_URL
  const cdpCallbackOrigin = env[cdpCallbackOriginEnv]?.trim() || null
  const cdpCallbackPlugin = accountWebCDPCallbackPlugin(cdpCallbackOrigin)

  return {
    plugins: [
      ...(cdpCallbackPlugin == null ? [] : [cdpCallbackPlugin]),
      {
        name: 'account-web-rename-output-html',
        apply: 'build',
        closeBundle() {
          const from = resolve('dist/account.html')
          const to = resolve('dist/index.html')
          if (fs.existsSync(from)) fs.renameSync(from, to)
        }
      },
      {
        name: 'account-web-dev-spa-fallback',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url == null) return next()
            const pathname = new URL(req.url, 'http://localhost').pathname
            // Skip Vite internal requests
            if (pathname.startsWith('/@')) return next()
            // Skip requests for static assets (have file extensions)
            if (pathname.includes('.')) return next()
            // Skip API proxy requests
            if (pathname.startsWith('/api/')) return next()
            // Skip the entry HTML itself
            if (pathname === '/account.html') return next()
            // SPA fallback: serve account.html for unmatched HTML routes (e.g. /sign-in)
            req.url = '/account.html'
            next()
          })
        }
      },
      vue(),
      tailwindcss(),
      createVercelOutputPlugin({
        headers: [
          {
            source: '/(.*)',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=300'
              },
              {
                key: 'Cross-Origin-Embedder-Policy',
                value: 'require-corp'
              },
              {
                key: 'Cross-Origin-Opener-Policy',
                value: 'same-origin'
              }
            ]
          },
          {
            source: '/assets/(.*)',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable'
              }
            ]
          }
        ],
        rewrites: [
          {
            source: '/api/(.*)',
            destination: vercelProxiedApiBaseURL == null ? null : `${vercelProxiedApiBaseURL}/$1`
          },
          {
            source: '/(.*)',
            destination: '/index.html'
          }
        ]
      })
    ],
    resolve: {
      alias: {
        '@': resolve('src'),
        '@docs': resolve('../docs')
      }
    },
    publicDir: false,
    build: {
      target: browserslistToEsbuild(),
      rolldownOptions: {
        input: {
          'sign-in': resolve('account.html')
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js'
        }
      }
    },
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin'
      },
      proxy: (() => {
        const target = env.VITE_API_BASE_URL
        if (!target) return undefined
        return {
          '/api': {
            target,
            changeOrigin: true,
            rewrite: (path: string) => path.replace(/^\/api/, '/account')
          }
        }
      })()
    }
  }
})
