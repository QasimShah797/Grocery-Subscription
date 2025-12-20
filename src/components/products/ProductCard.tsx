import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingBag } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onAddToSubscription?: (productId: string) => void;
  isInSubscription?: boolean;
}

export function ProductCard({ product, onAddToSubscription, isInSubscription }: ProductCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    onAddToSubscription?.(product.id);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="aspect-square relative overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        <Badge 
          variant="secondary" 
          className="absolute top-3 left-3 backdrop-blur-sm bg-card/80"
        >
          {product.category}
        </Badge>
        {isInSubscription && (
          <Badge 
            variant="success" 
            className="absolute top-3 right-3"
          >
            In Subscription
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-display font-semibold text-foreground mb-1 truncate">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price_pkr)}
          </span>
          <Button 
            size="sm" 
            onClick={handleAddClick}
            disabled={isInSubscription}
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
