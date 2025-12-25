import { Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useOrdersWithDelivery } from '@/hooks/useOrders';
import { Loader2, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function OrderHistory() {
  const { user, loading } = useAuth();
  const { data: orders, isLoading } = useOrdersWithDelivery();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const formatPrice = (price: number) => new Intl.NumberFormat('en-PK', { 
    style: 'currency', 
    currency: 'PKR', 
    minimumFractionDigits: 0 
  }).format(price);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'processing': return <Badge className="bg-blue-100 text-blue-700">Processing</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-700">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDeliveryStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'picked_up': return <Truck className="w-5 h-5 text-blue-600" />;
      case 'assigned': return <Package className="w-5 h-5 text-yellow-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-400" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getDeliveryStatusText = (status: string | undefined) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'picked_up': return 'Out for Delivery';
      case 'assigned': return 'Rider Assigned';
      case 'pending': return 'Preparing';
      case 'cancelled': return 'Cancelled';
      default: return 'Processing';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-2">Order History</h1>
          <p className="text-muted-foreground mb-6">Track your orders and delivery status</p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : orders?.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground">Your order history will appear here once you make a purchase.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders?.map((order: any) => {
                const delivery = order.delivery_assignments?.[0];
                const rider = delivery?.riders;
                
                return (
                  <Card key={order.id}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <CardTitle className="text-lg">
                          Order #{order.id.slice(0, 8)}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getPaymentStatusBadge(order.payment_status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">{new Date(order.created_at).toLocaleDateString('en-PK', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold text-lg text-primary">{formatPrice(order.amount_pkr)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment Method</p>
                          <p className="font-medium capitalize">{order.payment_method.replace('_', ' ')}</p>
                        </div>
                      </div>

                      {/* Delivery Status */}
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-3">Delivery Status</p>
                        <div className="flex items-center gap-3">
                          {getDeliveryStatusIcon(delivery?.status)}
                          <div>
                            <p className="font-medium">{getDeliveryStatusText(delivery?.status)}</p>
                            {rider && (
                              <p className="text-sm text-muted-foreground">
                                Rider: {rider.profiles?.full_name || 'Assigned'} • {rider.phone}
                              </p>
                            )}
                            {delivery?.delivered_at && (
                              <p className="text-sm text-green-600">
                                Delivered on {new Date(delivery.delivered_at).toLocaleDateString('en-PK', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Delivery Timeline */}
                        {delivery && (
                          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <div className={`w-2 h-2 rounded-full ${delivery.status ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>Ordered</span>
                            <div className="flex-1 h-px bg-gray-200" />
                            <div className={`w-2 h-2 rounded-full ${delivery.assigned_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>Assigned</span>
                            <div className="flex-1 h-px bg-gray-200" />
                            <div className={`w-2 h-2 rounded-full ${delivery.picked_up_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>Picked Up</span>
                            <div className="flex-1 h-px bg-gray-200" />
                            <div className={`w-2 h-2 rounded-full ${delivery.delivered_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>Delivered</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
