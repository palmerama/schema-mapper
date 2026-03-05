import {useState, useEffect, useRef} from 'react'
import type {SanityClient} from '@sanity/client'

interface ProjectAccessState {
  /** Whether the user has access to the project. `null` means still checking. */
  hasAccess: boolean | null
  /** Whether the access check is in progress. */
  isChecking: boolean
  /** Error string if something went wrong. 'rate_limited' for 429s, descriptive string for network errors. `null` if no error. */
  error: string | null
}

/**
 * Extracts the HTTP status code from a Sanity client error.
 * Sanity client errors typically have `statusCode` or `response.status`.
 */
function getStatusCode(err: unknown): number | null {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (typeof e.statusCode === 'number') return e.statusCode
    if (typeof e.status === 'number') return e.status
    if (e.response && typeof e.response === 'object') {
      const resp = e.response as Record<string, unknown>
      if (typeof resp.status === 'number') return resp.status
      if (typeof resp.statusCode === 'number') return resp.statusCode
    }
  }
  return null
}

/**
 * Hook that checks whether the current user has access to a Sanity project.
 *
 * Makes a lightweight GET request to `/projects/{projectId}`. If it succeeds,
 * the user has access. A 403 or 404 means no access (not treated as an error).
 * A 429 sets error to 'rate_limited' so the caller can retry.
 * Other errors are surfaced as error strings.
 *
 * @param projectId - The Sanity project ID to check access for.
 * @param client - A SanityClient instance (from @sanity/client or @sanity/sdk-react).
 */
function useProjectAccess(projectId: string, client: SanityClient): ProjectAccessState {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Store client in a ref to avoid it being an unstable dependency
  const clientRef = useRef(client)
  clientRef.current = client

  useEffect(() => {
    // Reset state when projectId changes
    setHasAccess(null)
    setIsChecking(true)
    setError(null)

    const abortController = new AbortController()

    async function checkAccess() {
      try {
        const config = clientRef.current.config()
        const res = await fetch(`https://api.sanity.io/v2024-01-01/projects/${projectId}`, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })
        if (!res.ok) {
          const err: any = new Error(`${res.status}`)
          err.statusCode = res.status
          throw err
        }

        // Request succeeded — user has access
        if (!abortController.signal.aborted) {
          setHasAccess(true)
          setIsChecking(false)
          setError(null)
        }
      } catch (err: unknown) {
        if (abortController.signal.aborted) return

        const statusCode = getStatusCode(err)

        if (statusCode === 403 || statusCode === 404) {
          // No access — not an error, just no permission
          setHasAccess(false)
          setIsChecking(false)
          setError(null)
        } else if (statusCode === 429) {
          // Rate limited — don't mark as no access, let caller retry
          setHasAccess(null)
          setIsChecking(false)
          setError('rate_limited')
        } else {
          // Network error or unexpected status
          const message =
            err instanceof Error
              ? err.message
              : typeof err === 'string'
                ? err
                : 'Unknown error checking project access'
          setHasAccess(null)
          setIsChecking(false)
          setError(message)
        }
      }
    }

    checkAccess()

    return () => {
      abortController.abort()
    }
  }, [projectId])

  return {hasAccess, isChecking, error}
}

export default useProjectAccess
