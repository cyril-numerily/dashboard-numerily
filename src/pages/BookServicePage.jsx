import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { getSubscriptionDetails } from '@/config/subscriptions';
import * as LucideIcons from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const BookServicePage = () => {
  const { serviceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [service, setService] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [details, setDetails] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const debouncedPromoCode = useDebounce(promoCode, 500);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  
  const subscriptionDetails = getSubscriptionDetails(profile?.subscription);
  const subscriptionDiscount = subscriptionDetails.discountPercentage;

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const partnerIdFromUrl = queryParams.get('partner_id');
  const isPartnerBooking = partnerIdFromUrl && profile?.role === 'partner' && profile.id === partnerIdFromUrl;

  const fetchServiceDetails = useCallback(async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error || !data) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Service non trouvé." });
      navigate('/dashboard');
      return;
    }
    setService(data);
  }, [serviceId, toast, navigate]);

  const fetchPartnerClients = useCallback(async () => {
    if (!isPartnerBooking) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('partner_id', profile.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger la liste des clients." });
      return;
    }
    setClients(data);
  }, [isPartnerBooking, profile, toast]);

  useEffect(() => {
    setPageLoading(true);
    Promise.all([fetchServiceDetails(), fetchPartnerClients()]).finally(() => {
      setPageLoading(false);
    });
  }, [fetchServiceDetails, fetchPartnerClients]);
  
  const handleApplyPromoCode = useCallback(async (code) => {
    if (!code || !service || profile?.role === 'partner') {
        if(appliedPromo) setAppliedPromo(null);
        return;
    }
    setPromoLoading(true);
    const { data, error } = await supabase.rpc('apply_promo_code', { p_code: code, p_service_id: service.id });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur RPC', description: "Impossible de valider le code promo." });
      setAppliedPromo(null);
    } else {
      if (data.valid) {
        setAppliedPromo(data);
        if(debouncedPromoCode) toast({ title: 'Succès', description: data.message });
      } else {
        setAppliedPromo(null);
        if(debouncedPromoCode) toast({ variant: 'destructive', title: 'Code Invalide', description: data.message });
      }
    }
    setPromoLoading(false);
  }, [service, toast, profile?.role, debouncedPromoCode, appliedPromo]);

  useEffect(() => {
    handleApplyPromoCode(debouncedPromoCode);
  }, [debouncedPromoCode, handleApplyPromoCode]);

  const calculateFinalPrice = useCallback(() => {
    if (!service) return 0;
    
    let priceAfterSubscription = service.price;
    if (subscriptionDiscount > 0 && service.subscription_discount_enabled) {
        priceAfterSubscription = service.price * (1 - subscriptionDiscount / 100);
    }

    let finalPrice = priceAfterSubscription;
    if (appliedPromo && appliedPromo.valid) {
        if (appliedPromo.type === 'percentage') {
            finalPrice *= (1 - appliedPromo.value / 100);
        } else if (appliedPromo.type === 'fixed') {
            finalPrice -= appliedPromo.value;
        }
    }
    return Math.max(0, finalPrice);
  }, [service, appliedPromo, subscriptionDiscount]);
  
  const finalPrice = useMemo(() => calculateFinalPrice(), [calculateFinalPrice]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPartnerBooking && !selectedClient) {
        toast({ variant: "destructive", title: "Client manquant", description: "Veuillez sélectionner un client." });
        return;
    }
    setIsSubmitting(true);
    
    const clientUser = isPartnerBooking ? clients.find(c => c.id === selectedClient) : profile;

    const requestData = {
        user_id: clientUser.id,
        user_name: clientUser.name,
        user_email: clientUser.email,
        service_id: service.id,
        service_title: service.title,
        final_price: finalPrice,
        status: 'Nouvelle',
        details: details,
        promo_code: appliedPromo?.valid ? promoCode : null,
        promo_id: appliedPromo?.valid ? appliedPromo.promo_id : null,
        requested_by_role: isPartnerBooking ? 'partner' : 'user',
        requested_by_id: isPartnerBooking ? profile.id : clientUser.id,
    };

    const { error } = await supabase.from('service_requests').insert([requestData]);

    if(error) {
        toast({ variant: "destructive", title: "Erreur de soumission", description: error.message });
    } else {
        toast({ title: "Succès", description: "Votre demande de service a été envoyée." });
        navigate('/dashboard');
    }
    setIsSubmitting(false);
  };

  if (pageLoading || authLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader size="lg" /></div>;
  }

  const ServiceIcon = service?.icon ? LucideIcons[service.icon] || LucideIcons['Package'] : LucideIcons['Package'];
  const priceAfterSubscription = service.subscription_discount_enabled ? service.price * (1 - subscriptionDiscount / 100) : service.price;

  return (
    <>
      <Helmet>
        <title>Commander: {service?.title || 'Service'} - Numerily</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto"
      >
        <form onSubmit={handleSubmit}>
          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center gap-4">
                <ServiceIcon className="w-10 h-10 text-primary" />
                <div>
                  <CardTitle className="text-3xl text-foreground">{service.title}</CardTitle>
                  <CardDescription>{service.short_description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isPartnerBooking && (
                <div>
                  <Label htmlFor="client-select">Sélectionner un client</Label>
                  <Select onValueChange={setSelectedClient} value={selectedClient} required>
                    <SelectTrigger id="client-select">
                      <SelectValue placeholder="Choisissez un client pour qui commander..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name} ({client.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="details">Détails supplémentaires</Label>
                <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Ajoutez des informations ou des instructions spécifiques ici..." />
              </div>
              {profile?.role !== 'partner' && (
                <div className="flex gap-2 items-end">
                  <div className="flex-grow">
                    <Label htmlFor="promo-code">Code Promo</Label>
                    <div className="relative">
                      <Input id="promo-code" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Ex: BETA25" />
                      {promoLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader size="sm" /></div>}
                    </div>
                  </div>
                </div>
              )}
              <Card className="bg-secondary p-6 space-y-3 rounded-xl border-none">
                <h3 className="font-semibold text-foreground">Récapitulatif du prix</h3>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Prix de base</span>
                  <span className="text-foreground">{service.price.toFixed(2)} €</span>
                </div>
                 {subscriptionDiscount > 0 && service.subscription_discount_enabled && (
                  <div className="flex justify-between text-sm text-blue-500">
                    <span>Réduction abonnement (-{subscriptionDiscount}%)</span>
                    <span>-{(service.price - priceAfterSubscription).toFixed(2)} €</span>
                  </div>
                )}
                {appliedPromo?.valid && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span>Réduction code promo ({appliedPromo.type === 'percentage' ? `${appliedPromo.value}%` : `${appliedPromo.value}€`})</span>
                    <span>-{(priceAfterSubscription - finalPrice).toFixed(2)} €</span>
                  </div>
                )}
                <div className="border-t border-border my-2"></div>
                <div className="flex justify-between font-bold text-2xl text-foreground">
                  <span>Total</span>
                  <span>{finalPrice.toFixed(2)} €</span>
                </div>
              </Card>
            </CardContent>
            <CardFooter>
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader size="sm" /> : 'Confirmer la commande'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </motion.div>
    </>
  );
};

export default BookServicePage;