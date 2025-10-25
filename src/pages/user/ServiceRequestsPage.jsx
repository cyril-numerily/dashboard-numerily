import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/components/ui/use-toast';
import { ListChecks, UserCheck } from 'lucide-react';

const statusVariant = {
  'Nouvelle': 'default',
  'En cours': 'secondary',
  'Validée': 'outline',
  'Annulée': 'destructive',
};

const ServiceRequestsPage = () => {
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServiceRequests = useCallback(async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*, requester:requested_by_id(name)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        // The foreign key is now in place, but let's keep this for robustness
        const { data: fallbackData, error: fallbackError } = await supabase
            .from('service_requests')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;

        const requestsWithNames = await Promise.all(fallbackData.map(async (req) => {
            if (req.requested_by_id) {
                const { data: profileData } = await supabase.from('profiles').select('name').eq('id', req.requested_by_id).single();
                return { ...req, requester: profileData };
            }
            return { ...req, requester: null };
        }));
        setRequests(requestsWithNames || []);
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les demandes de service.",
      });
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  useEffect(() => {
    if (!authLoading && profile) {
      setLoading(true);
      fetchServiceRequests();
    }
  }, [authLoading, profile, fetchServiceRequests]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase.channel(`service-requests-page-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `user_id=eq.${profile.id}` }, 
      () => fetchServiceRequests())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, fetchServiceRequests]);
  
  if (loading || authLoading) {
      return (
          <div className="flex h-[50vh] items-center justify-center">
              <Loader size="lg" />
          </div>
      );
  }

  return (
    <>
      <Helmet>
        <title>Mes Demandes de Service - Numerily</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl mx-auto"
      >
        <div className="text-center mb-12">
            <ListChecks className="mx-auto h-12 w-12 text-foreground mb-4" />
            <h1 className="text-4xl font-bold text-foreground">Mes Demandes de Service</h1>
            <p className="text-lg text-muted-foreground mt-2">Suivez ici l'état d'avancement de toutes vos demandes.</p>
        </div>

        <Card className="glass-effect rounded-xl bg-card">
          <CardHeader>
            <CardTitle className="text-foreground text-xl">Historique des demandes</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3">Service</th>
                      <th className="px-6 py-3">Demandé par</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Prix Final</th>
                      <th className="px-6 py-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req, index) => (
                      <motion.tr 
                        key={req.id} 
                        className="border-b border-border hover:bg-secondary transition-colors duration-200"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4 font-medium text-foreground">{req.service_title}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {req.requested_by_role === 'partner' ? (
                            <span className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-primary" />
                              {req.requester?.name || 'Partenaire'}
                            </span>
                          ) : 'Moi-même'}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{new Date(req.created_at).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4 text-muted-foreground">{req.final_price ? req.final_price.toFixed(2) : 'N/A'} €</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={statusVariant[req.status] || 'default'}>
                            <span className="rounded-md">{req.status}</span>
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">Vous n'avez encore fait aucune demande de service.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default ServiceRequestsPage;