'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Package, 
  MapPin, 
  FileText, 
  Edit2, 
  Trash2, 
  Plus,
  Loader2,
  LogOut
} from 'lucide-react';
import { formatCurrency } from '@/lib/pricing-utils';
import Image from 'next/image';

type Profile = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  order_items: Array<{
    quantity: number;
    price: number;
    products: {
      id: string;
      name: string;
      image_url: string | null;
    };
  }>;
};

type Address = {
  id: string;
  name: string;
  phone1: string;
  phone2?: string;
  address: string;
  city: string;
  state: string;
  is_default?: boolean;
};

type CustomOrder = {
  id: string;
  stl_file_name?: string;
  image_file_name?: string;
  material_type?: string;
  size_option?: string;
  total_price: number;
  status: string;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'custom'>('profile');
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [customOrders, setCustomOrders] = useState<{
    actionFigures: CustomOrder[];
    posters: CustomOrder[];
  }>({ actionFigures: [], posters: [] });

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0) {
      loadOrders();
    } else if (activeTab === 'addresses' && addresses.length === 0) {
      loadAddresses();
    } else if (activeTab === 'custom' && customOrders.actionFigures.length === 0) {
      loadCustomOrders();
    }
  }, [activeTab]);

  const loadProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setProfileForm({ name: data.name || '', phone: data.phone || '' });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/profile/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadAddresses = async () => {
    try {
      const res = await fetch('/api/profile/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const loadCustomOrders = async () => {
    try {
      const res = await fetch('/api/profile/custom-orders');
      if (res.ok) {
        const data = await res.json();
        setCustomOrders(data);
      }
    } catch (error) {
      console.error('Failed to load custom orders:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile({ ...profile!, name: updated.name, phone: updated.phone });
        setEditingProfile(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mugen-crimson" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-white">My Account</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'addresses', label: 'Addresses', icon: MapPin },
            { id: 'custom', label: 'Custom Orders', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-mugen-crimson text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && profile && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.name || 'User'}
                      width={100}
                      height={100}
                      className="rounded-full border-2 border-mugen-gold"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-mugen-gold bg-mugen-crimson/20 flex items-center justify-center">
                      <User className="h-12 w-12 text-mugen-gold" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  {editingProfile ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full rounded-lg border border-white/20 bg-mugen-black/50 px-4 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full rounded-lg border border-white/20 bg-mugen-black/50 px-4 py-2 text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateProfile}
                          className="rounded-lg bg-mugen-crimson px-4 py-2 text-sm font-semibold text-white hover:bg-mugen-crimson/90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingProfile(false)}
                          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white">
                          {profile.name || 'No name set'}
                        </h2>
                        <button
                          onClick={() => setEditingProfile(true)}
                          className="flex items-center gap-2 text-sm font-semibold text-mugen-gold hover:text-white"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                      <div className="space-y-2 text-white/70">
                        <p>
                          <span className="font-semibold text-white">Email:</span> {profile.email}
                        </p>
                        {profile.phone && (
                          <p>
                            <span className="font-semibold text-white">Phone:</span> {profile.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                  <Package className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No orders yet</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white">
                          Order #{order.order_number || order.id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-white/60">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-mugen-crimson">
                          {formatCurrency(order.total_price)}
                        </p>
                        <p className={`text-sm ${
                          order.payment_status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {order.payment_status}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {order.order_items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="text-sm text-white/70">
                          {item.products?.name} × {item.quantity}
                          {idx < order.order_items.length - 1 && idx < 2 ? ',' : ''}
                        </div>
                      ))}
                      {order.order_items.length > 3 && (
                        <span className="text-sm text-white/60">
                          +{order.order_items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <AddressesSection
              addresses={addresses}
              onRefresh={loadAddresses}
            />
          )}

          {/* Custom Orders Tab */}
          {activeTab === 'custom' && (
            <CustomOrdersSection customOrders={customOrders} />
          )}
        </div>
      </div>
    </main>
  );
}

// Addresses Section Component
function AddressesSection({ 
  addresses, 
  onRefresh 
}: { 
  addresses: Address[]; 
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Saved Addresses</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-mugen-crimson px-4 py-2 text-sm font-semibold text-white hover:bg-mugen-crimson/90"
        >
          <Plus className="h-4 w-4" />
          Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <MapPin className="h-12 w-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">No saved addresses</p>
        </div>
      ) : (
        addresses.map((address) => (
          <div
            key={address.id}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white mb-2">{address.name}</h3>
                <p className="text-sm text-white/70">{address.address}</p>
                <p className="text-sm text-white/70">
                  {address.city}, {address.state}
                </p>
                <p className="text-sm text-white/70 mt-2">{address.phone1}</p>
              </div>
              <div className="flex gap-2">
                <button className="text-white/60 hover:text-white">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Custom Orders Section
function CustomOrdersSection({ 
  customOrders 
}: { 
  customOrders: { actionFigures: CustomOrder[]; posters: CustomOrder[] };
}) {
  return (
    <div className="space-y-6">
      {/* Action Figures */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Custom Action Figures</h2>
        {customOrders.actionFigures.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/60">No custom action figures yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {customOrders.actionFigures.map((order) => (
              <div key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white">{order.stl_file_name}</h3>
                    <p className="text-sm text-white/60 mt-1">
                      Material: {order.material_type}
                    </p>
                    <p className="text-sm text-white/60">
                      Status: <span className="text-yellow-400">{order.status}</span>
                    </p>
                  </div>
                  <p className="font-bold text-mugen-crimson">
                    {formatCurrency(order.total_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personalized Posters */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Personalized Posters</h2>
        {customOrders.posters.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/60">No personalized posters yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {customOrders.posters.map((order) => (
              <div key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white">{order.image_file_name}</h3>
                    <p className="text-sm text-white/60 mt-1">
                      Size: {order.size_option}
                    </p>
                    <p className="text-sm text-white/60">
                      Status: <span className="text-yellow-400">{order.status}</span>
                    </p>
                  </div>
                  <p className="font-bold text-mugen-crimson">
                    {formatCurrency(order.total_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
