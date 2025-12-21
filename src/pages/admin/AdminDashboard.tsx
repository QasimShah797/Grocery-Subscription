import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/hooks/useProducts';
import { useAllSubscriptions } from '@/hooks/useSubscription';
import { useAllOrders } from '@/hooks/useOrders';
import { Package, Users, ShoppingCart, Receipt, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const { data: products } = useProducts();
  const { data: subscriptions } = useAllSubscriptions();
  const { data: orders } = useAllOrders();
  
  const { data: usersCount } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
  const completedOrders = orders?.filter(o => o.payment_status === 'completed').length || 0;
  const pendingOrders = orders?.filter(o => o.payment_status === 'pending').length || 0;
  const totalRevenue = orders?.filter(o => o.payment_status === 'completed').reduce((sum, o) => sum + o.amount_pkr, 0) || 0;

  const formatPrice = (price: number) => new Intl.NumberFormat('en-PK', { 
    style: 'currency', 
    currency: 'PKR', 
    minimumFractionDigits: 0 
  }).format(price);

  const stats = [
    { title: 'Total Products', value: products?.length || 0, icon: Package, color: 'text-blue-500' },
    { title: 'Total Users', value: usersCount || 0, icon: Users, color: 'text-green-500' },
    { title: 'Active Subscriptions', value: activeSubscriptions, icon: ShoppingCart, color: 'text-purple-500' },
    { title: 'Pending Orders', value: pendingOrders, icon: Receipt, color: 'text-yellow-500' },
    { title: 'Completed Orders', value: completedOrders, icon: Receipt, color: 'text-emerald-500' },
    { title: 'Total Revenue', value: formatPrice(totalRevenue), icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Dashboard Overview</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{(order as any).profiles?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{order.payment_method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(order.amount_pkr)}</p>
                    <p className={`text-xs ${order.payment_status === 'completed' ? 'text-green-500' : order.payment_status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {order.payment_status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
