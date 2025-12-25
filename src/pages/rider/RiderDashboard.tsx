import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRiderAssignments, useUpdateDeliveryStatus } from '@/hooks/useDeliveryAssignments';
import { Loader2, MapPin, Phone, User, Package, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function RiderDashboard() {
  const { user, isRider, loading: authLoading } = useAuth();
  const { data: assignments, isLoading } = useRiderAssignments();
  const updateStatus = useUpdateDeliveryStatus();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check rider approval status
  const { data: riderProfile, isLoading: riderLoading } = useQuery({
    queryKey: ['rider_profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const formatPrice = (price: number) => new Intl.NumberFormat('en-PK', { 
    style: 'currency', 
    currency: 'PKR', 
    minimumFractionDigits: 0 
  }).format(price);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: 'Status updated successfully' });
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'picked_up': return 'bg-blue-100 text-blue-700';
      case 'assigned': return 'bg-yellow-100 text-yellow-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const pendingDeliveries = assignments?.filter(a => a.status !== 'delivered' && a.status !== 'cancelled') || [];
  const completedDeliveries = assignments?.filter(a => a.status === 'delivered') || [];

  if (authLoading || isLoading || riderLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">Please login to access the rider dashboard.</p>
            <button 
              onClick={() => navigate('/rider/login')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Go to Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if rider has pending approval
  if (riderProfile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">Application Pending</h2>
            <p className="text-muted-foreground mb-4">
              Your rider application is being reviewed by our admin team. You'll be able to access the dashboard once approved.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Go to Home
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if rider was rejected
  if (riderProfile?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Application Rejected</h2>
            <p className="text-muted-foreground mb-4">
              Unfortunately, your rider application was not approved. Please contact support for more information.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Go to Home
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isRider && !riderProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have rider access. Please sign up as a rider to get started.
            </p>
            <button 
              onClick={() => navigate('/rider/signup')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Become a Rider
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-display font-bold">Rider Dashboard</h1>
          <p className="text-primary-foreground/80">Your delivery assignments</p>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{pendingDeliveries.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{completedDeliveries.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle>Active Deliveries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingDeliveries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No active deliveries</p>
            ) : (
              pendingDeliveries.map((assignment) => {
                const order = assignment.orders as any;
                const customer = order?.profiles;
                
                return (
                  <Card key={assignment.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Order #{order?.id?.slice(0, 8)}</p>
                          <p className="text-lg font-bold text-primary">{formatPrice(order?.amount_pkr || 0)}</p>
                        </div>
                        <Badge className={getStatusColor(assignment.status || 'pending')}>
                          {assignment.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{customer?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <a href={`tel:${customer?.phone}`} className="text-primary hover:underline">
                            {customer?.phone || 'N/A'}
                          </a>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground">{customer?.address || 'No address provided'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <Select 
                          value={assignment.status || 'assigned'}
                          onValueChange={(value) => handleStatusUpdate(assignment.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="picked_up">Picked Up</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Completed Deliveries */}
        {completedDeliveries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Completed Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {completedDeliveries.slice(0, 5).map((assignment) => {
                const order = assignment.orders as any;
                return (
                  <div key={assignment.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="font-mono text-sm">#{order?.id?.slice(0, 8)}</span>
                    <span className="font-semibold">{formatPrice(order?.amount_pkr || 0)}</span>
                    <Badge variant="outline" className="text-green-600">Delivered</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
