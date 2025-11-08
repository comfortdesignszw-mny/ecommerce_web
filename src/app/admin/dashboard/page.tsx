'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function AdminDashboard() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-600">
          Manage your {session?.user?.storeName || 'electronics store'} from this dashboard.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📦</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">🛒</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">💰</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">⏳</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              0 need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Manage your product catalog
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/admin/products">
              <Button className="w-full">Manage Products</Button>
            </Link>
            <Link href="/admin/products/new">
              <Button variant="outline" className="w-full">Add New Product</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              Process customer orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/admin/orders">
              <Button className="w-full">View Orders</Button>
            </Link>
            <div className="text-sm text-gray-600 text-center">
              No new orders
            </div>
          </CardContent>
        </Card>

        {session?.user?.role === 'SUPER_ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                Manage admin accounts and approvals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/admin/admins">
                <Button className="w-full">Manage Admins</Button>
              </Link>
              <div className="text-sm text-orange-600 text-center">
                Pending registrations available
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest activity in your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <p>No recent activity</p>
            <p className="text-sm">Start by adding products to your store</p>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      {!session?.user?.storeName && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Getting Started</CardTitle>
            <CardDescription className="text-blue-700">
              Complete your store setup to start selling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">1</span>
                </div>
                <span className="text-blue-900">Add your first product</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">2</span>
                </div>
                <span className="text-gray-600">Set up payment methods</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">3</span>
                </div>
                <span className="text-gray-600">Configure shipping options</span>
              </div>
            </div>
            <Link href="/admin/products/new">
              <Button className="w-full">Add First Product</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}