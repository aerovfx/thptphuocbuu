'use client'

import { useEffect, useState } from 'react'
import CountdownLanding from './CountdownLanding'

const STORAGE_KEY = 'pb_rocket_launch_v1'

/**
 * Shows the rocket countdown overlay ONCE per user (localStorage).
 * After the launch date, it auto-launches and navigates to href.
 */
export default function LaunchOverlay(props: { launchAtIso: string; href: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY)
      if (v === '1') return
    } catch {
      // ignore
    }
    setShow(true)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999]">
      <CountdownLanding launchAtIso={props.launchAtIso} href={props.href} autoLaunch={true} autoLaunchDelayMs={650} />
    </div>
  )
}


