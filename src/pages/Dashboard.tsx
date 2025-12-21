import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useSubscription, useSubscriptionItems, useUpdateSubscriptionItem, useRemoveFromSubscription, useUpdateSubscription } from '@/hooks/useSubscription';
import { CheckoutDialog } from '@/components/checkout/CheckoutDialog';
import { Minus, Plus, Trash2, Calendar, Pause, Play, CreditCard } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: items } = useSubscriptionItems(subscription?.id);
  const updateItem = useUpdateSubscriptionItem();
  const removeItem = useRemoveFromSubscription();
  const updateSubscription = useUpdateSubscription();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const total = items?.reduce((sum, item) => sum + (item.product?.price_pkr || 0) * item.quantity, 0) || 0;

  const formatPrice = (price: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(price);

  const toggleStatus = () => {
    if (subscription) {
      updateSubscription.mutate({
        id: subscription.id,
        status: subscription.status === 'active' ? 'paused' : 'active',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-6">My Subscription</h1>

          {subscription ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {items?.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <img src={item.product?.image_url || ''} alt={item.product?.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.product?.name}</h3>
                        <p className="text-sm text-muted-foreground">{formatPrice(item.product?.price_pkr || 0)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity - 1 })}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button size="icon" variant="outline" onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => removeItem.mutate(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!items || items.length === 0) && (
                  <Card><CardContent className="p-8 text-center text-muted-foreground">No items yet. Add products to your subscription!</CardContent></Card>
                )}
              </div>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Type</span>
                    <Badge>{subscription.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge variant={subscription.status === 'active' ? 'success' : 'secondary'}>{subscription.status}</Badge>
                  </div>
                  {subscription.next_renewal_date && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Next Renewal</span>
                      <span className="text-sm">{new Date(subscription.next_renewal_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                  <Button className="w-full" onClick={() => setCheckoutOpen(true)} disabled={!items || items.length === 0}>
                    <CreditCard className="w-4 h-4 mr-2" /> Checkout
                  </Button>
                  <Button variant="outline" className="w-full" onClick={toggleStatus}>
                    {subscription.status === 'active' ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Resume</>}
                  </Button>
                </CardContent>
                
                {subscription && (
                  <CheckoutDialog
                    open={checkoutOpen}
                    onOpenChange={setCheckoutOpen}
                    subscriptionId={subscription.id}
                    amount={total}
                  />
                )}
              </Card>
            </div>
          ) : (
            <Card><CardContent className="p-8 text-center">You don't have an active subscription. Browse products to get started!</CardContent></Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
