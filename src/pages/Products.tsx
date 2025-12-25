import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useSubscription, useCreateSubscription, useAddToSubscription, useSubscriptionItems } from '@/hooks/useSubscription';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const categories = ['All', 'Dairy', 'Vegetables', 'Fruits', 'Grains', 'Meat', 'Beverages', 'Pantry', 'Bakery', 'Cooking'];

export default function Products() {
  const { data: products, isLoading } = useProducts();
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: subscriptionItems } = useSubscriptionItems(subscription?.id);
  const createSubscription = useCreateSubscription();
  const addToSubscription = useAddToSubscription();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const filteredProducts = products?.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );

  const subscriptionProductIds = subscriptionItems?.map((i) => i.product_id) || [];

  const handleAddToSubscription = async (productId: string) => {
    if (!subscription) {
      // Show dialog to select subscription type
      setPendingProductId(productId);
      setShowSubscriptionDialog(true);
    } else {
      addToSubscription.mutate({ subscriptionId: subscription.id, productId });
    }
  };

  const handleCreateSubscription = async () => {
    const newSub = await createSubscription.mutateAsync(selectedType);
    if (newSub && pendingProductId) {
      addToSubscription.mutate({ subscriptionId: newSub.id, productId: pendingProductId });
    }
    setShowSubscriptionDialog(false);
    setPendingProductId(null);
  };

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
              {filteredProducts?.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToSubscription={handleAddToSubscription}
                  isInSubscription={subscriptionProductIds.includes(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Subscription Type Selection Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Subscription Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select how often you'd like to receive your groceries. Product prices will be multiplied by the number of days in your subscription period.
            </p>
            <RadioGroup value={selectedType} onValueChange={(v) => setSelectedType(v as typeof selectedType)}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                  <span className="font-semibold">Weekly</span>
                  <span className="text-sm text-muted-foreground block">Price × 7 days</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                  <span className="font-semibold">Monthly</span>
                  <span className="text-sm text-muted-foreground block">Price × 30 days</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg border-green-200 bg-green-50 dark:bg-green-900/20">
                <RadioGroupItem value="yearly" id="yearly" />
                <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                  <span className="font-semibold">Yearly <span className="text-green-600 text-xs ml-1">10% OFF</span></span>
                  <span className="text-sm text-muted-foreground block">Price × 365 days - Best value!</span>
                </Label>
              </div>
            </RadioGroup>
            <Button className="w-full" onClick={handleCreateSubscription} disabled={createSubscription.isPending}>
              {createSubscription.isPending ? 'Creating...' : 'Start Subscription'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
