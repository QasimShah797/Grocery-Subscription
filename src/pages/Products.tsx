import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useSubscription, useCreateSubscription, useAddToSubscription, useSubscriptionItems } from '@/hooks/useSubscription';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const categories = ['All', 'Dairy', 'Vegetables', 'Fruits', 'Grains', 'Meat', 'Beverages', 'Pantry', 'Bakery', 'Cooking'];

export default function Products() {
  const { data: products, isLoading } = useProducts();
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: subscriptionItems } = useSubscriptionItems(subscription?.id);
  const createSubscription = useCreateSubscription();
  const addToSubscription = useAddToSubscription();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = products?.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );

  const subscriptionProductIds = subscriptionItems?.map((i) => i.product_id) || [];

  const handleAddToSubscription = async (productId: string) => {
    if (!subscription) {
      const newSub = await createSubscription.mutateAsync('weekly');
      if (newSub) {
        addToSubscription.mutate({ subscriptionId: newSub.id, productId });
      }
    } else {
      addToSubscription.mutate({ subscriptionId: subscription.id, productId });
    }
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
    </div>
  );
}
