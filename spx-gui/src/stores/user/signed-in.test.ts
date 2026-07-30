import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accountOAuthApisForXBuilder } from '@/apis/account/oauth'
import { ensureAccessToken, initUserState } from './signed-in'

const userStateStorageKey = 'builder-user'

describe('ensureAccessToken', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses credentials refreshed by another page while waiting for the refresh lock', async () => {
    localStorage.setItem(
      userStateStorageKey,
      JSON.stringify({
        accessToken: 'expired-access-token',
        accessTokenExpiresAt: Date.now(),
        refreshToken: 'old-refresh-token',
        username: 'alice'
      })
    )
    const request = vi.fn(async (_name: string, callback: () => Promise<void>) => {
      localStorage.setItem(
        userStateStorageKey,
        JSON.stringify({
          accessToken: 'new-access-token',
          accessTokenExpiresAt: Date.now() + 60 * 60 * 1000,
          refreshToken: 'new-refresh-token',
          username: 'alice'
        })
      )
      await callback()
    })
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request
      }
    })
    const refreshToken = vi.spyOn(accountOAuthApisForXBuilder, 'refreshToken')

    initUserState('client-id')

    await expect(ensureAccessToken()).resolves.toBe('new-access-token')
    expect(request).toHaveBeenCalledWith('builder-user-access-token', expect.any(Function))
    expect(refreshToken).not.toHaveBeenCalled()
  })

  it('waits for the access token lock when the cached token is valid', async () => {
    localStorage.setItem(
      userStateStorageKey,
      JSON.stringify({
        accessToken: 'access-token',
        accessTokenExpiresAt: Date.now() + 60 * 60 * 1000,
        refreshToken: 'refresh-token',
        username: 'alice'
      })
    )
    const request = vi.fn(async (_name: string, callback: () => Promise<void>) => callback())
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request
      }
    })

    initUserState('client-id')

    await expect(ensureAccessToken()).resolves.toBe('access-token')
    expect(request).toHaveBeenCalledWith('builder-user-access-token', expect.any(Function))
  })
})
