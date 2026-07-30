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
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: vi.fn(async (_name: string, callback: () => Promise<void>) => {
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
      }
    })
    const refreshToken = vi.spyOn(accountOAuthApisForXBuilder, 'refreshToken')

    initUserState('client-id')

    await expect(ensureAccessToken()).resolves.toBe('new-access-token')
    expect(refreshToken).not.toHaveBeenCalled()
  })
})
