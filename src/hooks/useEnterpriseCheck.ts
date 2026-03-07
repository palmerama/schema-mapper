import { useState, useEffect } from 'react'

const WORKER_URL = 'https://sanity-enterprise-check.gongapi.workers.dev'

// Test orgs that should always show the enterprise badge
const ENTERPRISE_OVERRIDES = new Set(['o02mZUBKf'])

interface EnterpriseStatus {
  isEnterprise: boolean
  isLoading: boolean
}

export function useEnterpriseCheck(orgId: string | undefined): EnterpriseStatus {
  const [isEnterprise, setIsEnterprise] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!orgId) return

    // Check local overrides first
    if (ENTERPRISE_OVERRIDES.has(orgId)) {
      setIsEnterprise(true)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetch(`${WORKER_URL}?org=${encodeURIComponent(orgId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setIsEnterprise(data.isEnterprise === true)
        }
      })
      .catch(() => {
        // Silently fail — don't block the app
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [orgId])

  return { isEnterprise, isLoading }
}
