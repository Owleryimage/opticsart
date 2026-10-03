import * as React from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { useRoute, matchRoute } from '@/lib/router'
import PublicLayout from '@/components/PublicLayout'
import Home from '@/pages/Home'
import Browse from '@/pages/Browse'
import WorkDetail from '@/pages/WorkDetail'
import Exhibitions from '@/pages/Exhibitions'
import ExhibitionDetail from '@/pages/ExhibitionDetail'
import Photographers from '@/pages/Photographers'
import PhotographerDetail from '@/pages/PhotographerDetail'
import About from '@/pages/About'
import Announcements from '@/pages/Announcements'
import AnnouncementDetail from '@/pages/AnnouncementDetail'
import AdminApp from '@/admin/AdminApp'

export default function App() {
  const route = useRoute()
  if (route.path === '/admin' || route.path.startsWith('/admin/')) {
    return (
      <ToastProvider>
        <AdminApp />
      </ToastProvider>
    )
  }
  const m = matchRoute(route.path, route.query)
  let page: React.ReactNode
  switch (m.name) {
    case 'browse':
      page = <Browse />
      break
    case 'work':
      page = <WorkDetail id={m.id!} />
      break
    case 'exhibitions':
      page = <Exhibitions />
      break
    case 'exhibition':
      page = <ExhibitionDetail id={m.id!} />
      break
    case 'photographers':
      page = <Photographers />
      break
    case 'photographer':
      page = <PhotographerDetail id={m.id!} />
      break
    case 'about':
      page = <About />
      break
    case 'announcement':
      page = <AnnouncementDetail id={m.id!} />
      break
    case 'announcements':
      page = <Announcements />
      break
    default:
      page = <Home />
  }
  return (
    <ToastProvider>
      <PublicLayout>{page}</PublicLayout>
    </ToastProvider>
  )
}
