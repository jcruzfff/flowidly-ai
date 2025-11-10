import { redirect } from 'next/navigation'

/**
 * Old dashboard route - redirects to new /proposals page
 */
export default async function DashboardPage() {
  redirect('/proposals')
}
