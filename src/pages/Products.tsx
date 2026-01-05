import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useUserSubscriptions, useCreateSubscription, useAddToSubscription, useSubscriptionItems } from '@/hooks/useSubscription';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const categories = ['All', 'Dairy', 'Vegetables', 'Fruits', 'Grains', 'Meat', 'Beverages', 'Pantry', 'Bakery', 'Cooking'];

export default function Products() {
  const { data: products, isLoading } = useProducts();
  const { user } = useAuth();
  const { data: subscriptions } = useUserSubscriptions();
  const createSubscription = useCreateSubscription();
  const addToSubscription = useAddToSubscription();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);

  // Get items from all subscriptions to check which products are already subscribed
  const weeklySubscription = subscriptions?.find(s => s.type === 'weekly');
  const monthlySubscription = subscriptions?.find(s => s.type === 'monthly');
  const yearlySubscription = subscriptions?.find(s => s.type === 'yearly');
  
  const { data: weeklyItems } = useSubscriptionItems(weeklySubscription?.id);
  const { data: monthlyItems } = useSubscriptionItems(monthlySubscription?.id);
  const { data: yearlyItems } = useSubscriptionItems(yearlySubscription?.id);
  
  const allSubscriptionProductIds = [
    ...(weeklyItems?.map(i => i.product_id) || []),
    ...(monthlyItems?.map(i => i.product_id) || []),
    ...(yearlyItems?.map(i => i.product_id) || []),
  ];

  const filteredProducts = products?.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );

  const getProductSubscriptionType = (productId: string): string | null => {
    if (weeklyItems?.some(i => i.product_id === productId)) return 'weekly';
    if (monthlyItems?.some(i => i.product_id === productId)) return 'monthly';
    if (yearlyItems?.some(i => i.product_id === productId)) return 'yearly';
    return null;
  };

  const handleAddToSubscription = async (productId: string) => {
    // If product is already in any subscription, don't allow adding
    if (allSubscriptionProductIds.includes(productId)) return;
    
    setPendingProductId(productId);
    setSelectedSubscriptionId(null);
    setShowSubscriptionDialog(true);
  };

  const handleConfirmAdd = async () => {
    if (!pendingProductId) return;
    
    if (selectedSubscriptionId) {
      // Add to existing subscription
      addToSubscription.mutate({ subscriptionId: selectedSubscriptionId, productId: pendingProductId });
    } else {
      // Create new subscription
      const newSub = await createSubscription.mutateAsync(selectedType);
      if (newSub) {
        addToSubscription.mutate({ subscriptionId: newSub.id, productId: pendingProductId });
      }
    }
    setShowSubscriptionDialog(false);
    setPendingProductId(null);
    setSelectedSubscriptionId(null);
  };

  const { data: orders } = useOrders();

  // Separate subscriptions into unpaid and paid (in-progress)
  const existingSubscriptions = subscriptions?.filter(s => s.status === 'active' || s.status === 'paused') || [];
  
  const unpaidSubscriptions = existingSubscriptions.filter(s => {
    const hasActiveOrder = orders?.some(order => 
      order.subscription_id === s.id && 
      (order.payment_status === 'pending' || order.payment_status === 'processing' || order.payment_status === 'completed')
    );
    return !hasActiveOrder;
  });

  const paidSubscriptions = existingSubscriptions.filter(s => {
    const hasActiveOrder = orders?.some(order => 
      order.subscription_id === s.id && 
      (order.payment_status === 'pending' || order.payment_status === 'processing' || order.payment_status === 'completed')
    );
    return hasActiveOrder;
  });

  // For new subscriptions, allow any type
  const availableNewTypes: ('weekly' | 'monthly' | 'yearly')[] = ['weekly', 'monthly', 'yearly'];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-2">Fresh Products</h1>
          <p className="text-muted-foreground mb-6">Add items to your subscription</p>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts?.map((product) => {
                const subscriptionType = getProductSubscriptionType(product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToSubscription={handleAddToSubscription}
                    isInSubscription={!!subscriptionType}
                    subscriptionType={subscriptionType}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Subscription Selection Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add this product to an existing subscription or create a new one.
            </p>
            
            {/* Paid Subscriptions (In Progress) */}
            {paidSubscriptions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Add for Next Billing Cycle</Label>
                <p className="text-xs text-muted-foreground">These subscriptions are already paid. New items will be charged on renewal.</p>
                <RadioGroup 
                  value={selectedSubscriptionId || ''} 
                  onValueChange={(v) => {
                    setSelectedSubscriptionId(v);
                    setSelectedType('weekly');
                  }}
                >
                  {paidSubscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center space-x-3 p-3 border rounded-lg border-blue-200 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                      <RadioGroupItem value={sub.id} id={sub.id} />
                      <Label htmlFor={sub.id} className="flex-1 cursor-pointer flex items-center justify-between">
                        <div>
                          <span className="font-semibold capitalize">{sub.type} Subscription</span>
                          <span className="text-xs text-blue-600 block">Charged on next renewal</span>
                        </div>
                        <Badge variant="secondary">In Progress</Badge>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Existing Unpaid Subscriptions */}
            {unpaidSubscriptions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Add to Unpaid Subscription</Label>
                <RadioGroup 
                  value={selectedSubscriptionId || ''} 
                  onValueChange={(v) => {
                    setSelectedSubscriptionId(v);
                    setSelectedType('weekly');
                  }}
                >
                  {unpaidSubscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value={sub.id} id={sub.id} />
                      <Label htmlFor={sub.id} className="flex-1 cursor-pointer flex items-center justify-between">
                        <span className="font-semibold capitalize">{sub.type} Subscription</span>
                        <Badge variant="outline">Unpaid</Badge>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
            
            {/* Create New Subscription */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {unpaidSubscriptions.length > 0 ? 'Or Create New Subscription' : 'Create New Subscription'}
              </Label>
                <RadioGroup 
                  value={selectedSubscriptionId ? '' : selectedType} 
                  onValueChange={(v) => {
                    setSelectedSubscriptionId(null);
                    setSelectedType(v as typeof selectedType);
                  }}
                >
                  {availableNewTypes.includes('weekly') && (
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="weekly" id="new-weekly" />
                      <Label htmlFor="new-weekly" className="flex-1 cursor-pointer">
                        <span className="font-semibold">Weekly</span>
                        <span className="text-sm text-muted-foreground block">Price × 7 days</span>
                      </Label>
                    </div>
                  )}
                  {availableNewTypes.includes('monthly') && (
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="monthly" id="new-monthly" />
                      <Label htmlFor="new-monthly" className="flex-1 cursor-pointer">
                        <span className="font-semibold">Monthly</span>
                        <span className="text-sm text-muted-foreground block">Price × 30 days</span>
                      </Label>
                    </div>
                  )}
                  {availableNewTypes.includes('yearly') && (
                    <div className="flex items-center space-x-3 p-3 border rounded-lg border-green-200 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30">
                      <RadioGroupItem value="yearly" id="new-yearly" />
                      <Label htmlFor="new-yearly" className="flex-1 cursor-pointer">
                        <span className="font-semibold">Yearly <span className="text-green-600 text-xs ml-1">10% OFF</span></span>
                        <span className="text-sm text-muted-foreground block">Price × 365 days - Best value!</span>
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </div>
            
            <Button 
              className="w-full" 
              onClick={handleConfirmAdd} 
              disabled={createSubscription.isPending || addToSubscription.isPending}
            >
              {createSubscription.isPending || addToSubscription.isPending ? 'Adding...' : 'Add to Subscription'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
