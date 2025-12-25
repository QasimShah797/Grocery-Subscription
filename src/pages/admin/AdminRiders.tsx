import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useRiders, useCreateRider, useUpdateRider, useDeleteRider } from '@/hooks/useRiders';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface RiderForm {
  user_id: string;
  phone: string;
  vehicle_type: string;
}

const emptyForm: RiderForm = {
  user_id: '',
  phone: '',
  vehicle_type: 'bike',
};

export default function AdminRiders() {
  const { data: riders, isLoading } = useRiders();
  const createRider = useCreateRider();
  const updateRider = useUpdateRider();
  const deleteRider = useDeleteRider();
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RiderForm>(emptyForm);

  // Fetch users who are not already riders
  const { data: availableUsers } = useQuery({
    queryKey: ['available_users_for_riders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      if (error) throw error;
      
      // Filter out users who are already riders
      const riderUserIds = riders?.map(r => (r as any).user_id) || [];
      return data.filter(u => !riderUserIds.includes(u.id));
    },
    enabled: dialogOpen && !editingId,
  });

  const handleEdit = (rider: any) => {
    setEditingId(rider.id);
    setForm({
      user_id: rider.user_id,
      phone: rider.phone,
      vehicle_type: rider.vehicle_type || 'bike',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this rider?')) {
      try {
        await deleteRider.mutateAsync(id);
        toast({ title: 'Rider removed successfully' });
      } catch {
        toast({ title: 'Failed to remove rider', variant: 'destructive' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateRider.mutateAsync({ 
          id: editingId, 
          phone: form.phone,
          vehicle_type: form.vehicle_type 
        });
        toast({ title: 'Rider updated successfully' });
      } else {
        await createRider.mutateAsync(form);
        toast({ title: 'Rider added successfully' });
      }
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      toast({ title: err.message || 'Failed to save rider', variant: 'destructive' });
    }
  };

  const handleAvailabilityToggle = async (id: string, is_available: boolean) => {
    try {
      await updateRider.mutateAsync({ id, is_available });
      toast({ title: `Rider marked as ${is_available ? 'available' : 'unavailable'}` });
    } catch {
      toast({ title: 'Failed to update availability', variant: 'destructive' });
    }
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-bold">Riders</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" /> Add Rider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Rider' : 'Add New Rider'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <div className="space-y-2">
                  <Label htmlFor="user">Select User</Label>
                  <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email || user.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={form.phone} 
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                  placeholder="03XX-XXXXXXX"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle Type</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createRider.isPending || updateRider.isPending}>
                {(createRider.isPending || updateRider.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Update' : 'Add Rider')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riders?.map((rider: any) => (
                  <TableRow key={rider.id}>
                    <TableCell className="font-medium">{rider.user_id.slice(0, 8)}...</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{rider.phone}</TableCell>
                    <TableCell className="capitalize">{rider.vehicle_type}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={rider.is_available} 
                        onCheckedChange={(checked) => handleAvailabilityToggle(rider.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(rider)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(rider.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
