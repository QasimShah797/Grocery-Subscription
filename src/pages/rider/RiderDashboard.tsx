import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRiderAssignments, useRiderDailyDeliveries, useMarkDailyDelivered } from '@/hooks/useDeliveryAssignments';
import { Loader2, MapPin, Phone, User, Package, CheckCircle, AlertCircle, Clock, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';

export default function RiderDashboard() {
  const { user, isRider, loading: authLoading } = useAuth();
  const { data: assignments, isLoading } = useRiderAssignments();
  const { data: todaysDeliveries, isLoading: todaysLoading } = useRiderDailyDeliveries();
  const markDelivered = useMarkDailyDelivered();
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

  const handleMarkDelivered = async (dailyId: string, assignmentId: string) => {
    try {
      await markDelivered.mutateAsync({ id: dailyId, assignment_id: assignmentId });
      toast({ title: 'Marked as delivered!' });
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'picked_up': return 'bg-blue-100 text-blue-700';
      case 'assigned': return 'bg-yellow-100 text-yellow-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const activeAssignments = assignments?.filter(a => 
    a.status !== 'completed' && a.status !== 'cancelled'
  ) || [];
  
  const completedAssignments = assignments?.filter(a => a.status === 'completed') || [];
  const todaysPendingCount = todaysDeliveries?.length || 0;

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
          <p className="text-primary-foreground/80">Your daily delivery assignments</p>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{todaysPendingCount}</p>
              <p className="text-xs text-muted-foreground">Today's Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold">{activeAssignments.length}</p>
              <p className="text-xs text-muted-foreground">Active Subs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{completedAssignments.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysLoading ? (
              <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : todaysDeliveries?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No deliveries pending for today</p>
            ) : (
              todaysDeliveries?.map((daily: any) => {
                const assignment = daily.delivery_assignments;
                const order = assignment?.orders;
                const customer = order?.profiles;
                
                return (
                  <Card key={daily.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Day {daily.day_number} of {assignment?.total_days}</p>
                          <p className="text-sm text-muted-foreground">{new Date(daily.delivery_date).toLocaleDateString()}</p>
                        </div>
                        <Badge className={getStatusColor(daily.status)}>
                          {daily.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{order?.payment_details?.sender_name || customer?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <a href={`tel:${order?.payment_details?.sender_mobile || customer?.phone}`} className="text-primary hover:underline font-medium">
                            {order?.payment_details?.sender_mobile || customer?.phone || 'N/A'}
                          </a>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground">
                            {order?.payment_details?.delivery_address || customer?.address || 'No address provided'}
                          </span>
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={() => handleMarkDelivered(daily.id, assignment.id)}
                        disabled={markDelivered.isPending}
                      >
                        {markDelivered.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Mark as Delivered
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Active Subscriptions Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeAssignments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No active subscriptions</p>
            ) : (
              activeAssignments.map((assignment) => {
                const order = assignment.orders as any;
                const customer = order?.profiles;
                const progress = ((assignment.delivered_days || 0) / (assignment.total_days || 7)) * 100;
                
                return (
                  <div key={assignment.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{customer?.full_name || 'Customer'}</p>
                        <p className="text-sm text-muted-foreground">
                          {order?.payment_details?.delivery_address || customer?.address || 'N/A'}
                        </p>
                      </div>
                      <Badge className={getStatusColor(assignment.status || 'pending')}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Days Delivered</span>
                        <span className="font-semibold">{assignment.delivered_days || 0} / {assignment.total_days || 7}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}