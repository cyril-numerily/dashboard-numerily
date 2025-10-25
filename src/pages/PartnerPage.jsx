import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import PartnerDashboard from '@/components/partner/PartnerDashboard';
import { useToast } from '@/components/ui/use-toast';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const PartnerPage = () => {
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [pageLoading, setPageLoading] = useState(true);

  const [activities, setActivities] = useState([]);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setPageLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      
      setActivities(data || []);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de récupérer les données du portail.",
      });
    } finally {
      setPageLoading(false);
    }
  }, [profile, toast]);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile, fetchData]);

  useEffect(() => {
    if (!profile) return;

    const channel = supabase.channel(`partner-page-${profile.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_activity_logs', filter: `user_id=eq.${profile.id}` }, () => fetchData())
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, fetchData]);
  
  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Portail Partenaire - Numerily</title>
        <meta name="description" content="Votre portail partenaire personnalisé chez Numerily." />
      </Helmet>
      {pageLoading ? (
          <div className="flex justify-center items-center h-64">
              <Loader size="md" />
          </div>
        ) : (
          <PartnerDashboard profile={profile} activities={activities} />
      )}
    </>
  );
};

export default PartnerPage;