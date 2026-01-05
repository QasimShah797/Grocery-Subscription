import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { useUserSubscriptions, useSubscriptionItems, useUpdateSubscriptionItem, useRemoveFromSubscription, useUpdateSubscription, Subscription } from '@/hooks/useSubscription';
import { useOrders } from '@/hooks/useOrders';
import { CheckoutDialog } from '@/components/checkout/CheckoutDialog';
import { Minus, Plus, Trash2, Calendar, Pause, Play, CreditCard, Package, CheckCircle } from 'lucide-react';

// Multipliers for subscription types
const SUBSCRIPTION_MULTIPLIERS = {
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

const YEARLY_DISCOUNT = 0.10;

function SubscriptionPanel({ subscription }: { subscription: Subscription }) {
  const { data: items } = useSubscriptionItems(subscription.id);
  const { data: orders } = useOrders();
  const updateItem = useUpdateSubscriptionItem();
  const removeItem = useRemoveFromSubscription();
  const updateSubscription = useUpdateSubscription();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Check if there's already an order for this subscription in the current billing cycle
  const existingOrder = orders?.find(order => 
    order.subscription_id === subscription.id && 
    (order.payment_status === 'pending' || order.payment_status === 'processing' || order.payment_status === 'completed')
  );
  const hasActiveOrder = !!existingOrder;

  const baseTotal = items?.reduce((sum, item) => sum + (item.product?.price_pkr || 0) * item.quantity, 0) || 0;
  const multiplier = SUBSCRIPTION_MULTIPLIERS[subscription.type as keyof typeof SUBSCRIPTION_MULTIPLIERS] || 1;
  const subtotal = baseTotal * multiplier;
  const isYearly = subscription.type === 'yearly';
  const discount = isYearly ? subtotal * YEARLY_DISCOUNT : 0;
  const total = subtotal - discount;

  const formatPrice = (price: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(price);

  const toggleStatus = () => {
    updateSubscription.mutate({
      id: subscription.id,
      status: subscription.status === 'active' ? 'paused' : 'active',
    });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Items */}
      <div className="lg:col-span-2 space-y-4">
        {items?.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <img src={item.product?.image_url || ''} alt={item.product?.name} className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1">
                <h3 className="font-semibold">{item.product?.name}</h3>
                <p className="text-sm text-muted-foreground">{formatPrice(item.product?.price_pkr || 0)}/day</p>
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
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              No items in this subscription. Browse products to add items!
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="capitalize">{subscription.type} Summary</span>
            <Badge variant={subscription.status === 'active' ? 'success' : 'secondary'}>{subscription.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.next_renewal_date && (
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Next Renewal</span>
              <span className="text-sm">{new Date(subscription.next_renewal_date).toLocaleDateString()}</span>
            </div>
          )}
          <hr />
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Daily price × {multiplier} days</p>
            {isYearly && (
              <p className="text-green-600 font-medium">🎉 10% yearly discount applied!</p>
            )}
          </div>
          {isYearly && (
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="line-through text-muted-foreground">{formatPrice(subtotal)}</span>
            </div>
          )}
          {isYearly && discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount (10%)</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
          {hasActiveOrder ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                <CheckCircle className="w-4 h-4" />
                <span>Order {existingOrder.payment_status === 'completed' ? 'completed' : 'in progress'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                New products will be included in your next billing cycle.
              </p>
            </div>
          ) : (
            <Button className="w-full" onClick={() => setCheckoutOpen(true)} disabled={!items || items.length === 0}>
              <CreditCard className="w-4 h-4 mr-2" /> Checkout
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={toggleStatus}>
            {subscription.status === 'active' ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Resume</>}
          </Button>
        </CardContent>
        
        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          subscriptionId={subscription.id}
          amount={total}
        />
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { data: subscriptions } = useUserSubscriptions();
  const [activeTab, setActiveTab] = useState<string>('');

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const activeSubscriptions = subscriptions?.filter(s => s.status === 'active' || s.status === 'paused') || [];
  
  // Set default tab to first subscription
  if (activeSubscriptions.length > 0 && !activeTab) {
    setActiveTab(activeSubscriptions[0].id);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-6">My Subscriptions</h1>

          {activeSubscriptions.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                {activeSubscriptions.map((sub) => (
                  <TabsTrigger key={sub.id} value={sub.id} className="capitalize">
                    {sub.type}
                    {sub.status === 'paused' && <Badge variant="secondary" className="ml-2 text-xs">Paused</Badge>}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {activeSubscriptions.map((sub) => (
                <TabsContent key={sub.id} value={sub.id}>
                  <SubscriptionPanel subscription={sub} />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg mb-2">You don't have any active subscriptions</p>
                <p className="text-muted-foreground mb-4">Browse products to get started with your first subscription!</p>
                <Button asChild>
                  <a href="/products">Browse Products</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}