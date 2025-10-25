import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpenCheck, CheckCircle, Code, ExternalLink, HelpCircle, History, Settings, ShoppingCart, User, Wrench, Bot, Ticket, Crown, Lock, Monitor, ShieldCheck, Server, Info, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { BetaProgramCard, BetaProgramStatusCard } from '@/components/partner/BetaProgramCards';
import { getSubscriptionDetails } from '@/config/subscriptions';
import { cn } from '@/lib/utils';


const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
};

const ServiceTrackerBanner = ({ request }) => {
    const { services: service } = request;
    const config = service.custom_banner_config;
    if (!config || !config.enabled || !config.steps || config.steps.length === 0) return null;

    const currentStepIndex = request.current_banner_step || 0;
    const currentStep = config.steps[currentStepIndex];
    const nextStep = currentStepIndex < config.steps.length - 1 ? config.steps[currentStepIndex + 1] : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-secondary/80 border border-border/50 p-6 rounded-lg"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-800 p-2 rounded-md">
                        <ClipboardList className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-xl text-foreground">Suivi : {request.service_title}</h3>
                </div>
                <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">{currentStep?.status || request.status}</span>
            </div>

            {currentStep && (
                <div className="mb-4">
                    <p className="font-semibold text-foreground">{currentStep.title}</p>
                    <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                </div>
            )}

            <div className="flex w-full h-2.5 rounded-full overflow-hidden gap-1">
                {config.steps.map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "h-full w-full rounded-full transition-colors duration-500",
                            index <= currentStepIndex ? "bg-primary" : "bg-muted"
                        )}
                    />
                ))}
            </div>

            {nextStep && (
                <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-semibold text-foreground">Prochaine étape :</span> {nextStep.title}
                </p>
            )}
        </motion.div>
    );
};


const TroubleshootingBanner = ({ onPrepare }) => (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-blue-500/10 border border-blue-500/30 text-blue-200 p-4 rounded-lg mb-8 flex items-center justify-between"
    >
        <div className="flex items-center gap-4">
            <Info className="h-6 w-6 text-blue-400" />
            <div>
                <h3 className="font-bold">Un dépannage est prévu !</h3>
                <p className="text-sm text-blue-300/80">Préparez votre session en installant l'outil d'assistance à distance.</p>
            </div>
        </div>
        <Button onClick={onPrepare} variant="outline" className="bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30 text-white">
            Se préparer <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
    </motion.div>
);

const FeatureCard = ({ icon: Icon, title, description, onClick, beta, isLocked, isVisible }) => {
    if (!isVisible) return null;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={!isLocked ? { y: -2, scale: 1.01 } : {}}
            className={`p-5 rounded-2xl transition-all bg-secondary flex flex-col justify-between border border-border/50 shadow-lg ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-border'}`}
            onClick={!isLocked ? onClick : () => {}}
        >
            <div>
                <div className="flex justify-between items-start mb-2">
                    <Icon className="w-7 h-7 text-foreground" />
                    <div className="flex items-center gap-2">
                        {isLocked && <Lock className="w-5 h-5 text-muted-foreground" />}
                        {beta && <div className="text-xs uppercase font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">Bêta</div>}
                    </div>
                </div>
                <h3 className="font-bold text-xl text-foreground mt-4 mb-1">{title}</h3>
                <p className="text-base text-muted-foreground">{description}</p>
            </div>
            {!isLocked && (
                <div className="flex justify-end mt-4">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>
            )}
        </motion.div>
    )
};


const ActivityItem = ({ activity, delay }) => (
  <motion.li
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: delay * 0.1 }}
    className="flex items-center justify-between text-base"
  >
    <p className="text-muted-foreground">{activity.activity_type}</p>
    <p className="text-muted-foreground font-mono text-sm">{new Date(activity.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </motion.li>
);

const GuideCard = () => {
    const steps = [
        { icon: User, title: "Gérez votre abonnement", description: "Accédez à la section 'Mon Compte' pour gérer votre abonnement et vos informations personnelles." },
        { icon: ShoppingCart, title: "Découvrez nos services", description: "Parcourez la page 'Services' pour trouver des solutions adaptées à vos besoins." },
        { icon: HelpCircle, title: "Besoin d'aide ?", description: "Utilisez la section 'Contact' ou 'Support Prioritaire' pour toute question ou problème." },
    ];
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><BookOpenCheck className="w-6 h-6 text-foreground" /> Guide de démarrage rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-foreground mt-1 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-lg text-foreground">{step.title}</p>
                            <p className="text-base text-muted-foreground">{step.description}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

const SubscribeCard = () => (
    <Card className="bg-gradient-to-br from-primary to-blue-700 text-primary-foreground">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
                <Crown className="w-6 h-6" />
                Débloquez Numerily Prime
            </CardTitle>
            <CardDescription className="text-base text-primary-foreground/80">
                Passez à un abonnement supérieur pour accéder à des avantages exclusifs.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button
                onClick={() => window.open('https://numerily.fr/prime', '_blank')}
                className="w-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm text-base py-3"
            >
                Voir les abonnements <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
        </CardContent>
    </Card>
);

const StatCard = ({ icon: Icon, title, value, isLoading }) => (
    <Card className="bg-secondary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="h-8 w-16 bg-muted-foreground/20 animate-pulse rounded-md"></div>
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
        </CardContent>
    </Card>
);

const UserStats = ({ userId }) => {
    const [stats, setStats] = useState({
        services: 0,
        troubleshooting: 0,
        devices: 0,
    });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const [
                    { count: servicesCount, error: servicesError },
                    { count: troubleshootingCount, error: troubleshootingError },
                    { data: profileData, error: profileError }
                ] = await Promise.all([
                    supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('user_id', userId),
                    supabase.from('troubleshooting_tickets').select('*', { count: 'exact', head: true }).eq('user_id', userId),
                    supabase.from('profiles').select('devices').eq('id', userId).single()
                ]);

                if (servicesError) throw servicesError;
                if (troubleshootingError) throw troubleshootingError;
                if (profileError) throw profileError;

                setStats({
                    services: servicesCount || 0,
                    troubleshooting: troubleshootingCount || 0,
                    devices: profileData?.devices?.length || 0,
                });
            } catch (error) {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les statistiques." });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [userId, toast]);

    return (
        <div className="pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Vos Statistiques</h2>
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard icon={Server} title="Services Commandés" value={stats.services} isLoading={loading} />
                <StatCard icon={Wrench} title="Dépannages Gratuits" value={stats.troubleshooting} isLoading={loading} />
                <StatCard icon={Monitor} title="Appareils Enregistrés" value={stats.devices} isLoading={loading} />
            </div>
        </div>
    );
};

const UserDashboard = () => {
  const { profile, loading: authLoading, updateProfileBetaStatus } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [hasActiveTicket, setHasActiveTicket] = useState(false);
  const [trackedRequests, setTrackedRequests] = useState([]);
  const [showAllTrackers, setShowAllTrackers] = useState(false);

  const subscriptionDetails = getSubscriptionDetails(profile?.subscription);
  const hasSubscription = profile?.subscription !== 'none';

  const fetchDashboardData = useCallback(async () => {
    if (!profile) return;
    setLoadingActivities(true);
    try {
      const [
        { data: activityData, error: activityError },
        { data: ticketData, error: ticketError },
        { data: requestData, error: requestError }
      ] = await Promise.all([
        supabase.from('user_activity_logs').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('troubleshooting_tickets').select('status').in('status', ['Ouvert', 'En cours']).eq('user_id', profile.id),
        supabase.from('service_requests').select('*, services:service_id(custom_banner_config)').eq('user_id', profile.id).not('status', 'eq', 'Validée').order('created_at', { ascending: false })
      ]);

      if (activityError) throw activityError;
      if (ticketError) throw ticketError;
      if (requestError) throw requestError;

      setActivities(activityData || []);
      setHasActiveTicket(ticketData && ticketData.length > 0);
      
      const activeTrackers = requestData.filter(req => req.services?.custom_banner_config?.enabled && req.status !== 'Annulée');
      setTrackedRequests(activeTrackers);

    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données du tableau de bord." });
    } finally {
      setLoadingActivities(false);
    }
  }, [profile, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
      if (!profile) return;
      const channel = supabase.channel(`user-dashboard-${profile.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'user_activity_logs', filter: `user_id=eq.${profile.id}` }, () => fetchDashboardData())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'troubleshooting_tickets', filter: `user_id=eq.${profile.id}` }, () => fetchDashboardData())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `user_id=eq.${profile.id}` }, () => fetchDashboardData())
          .subscribe();
      return () => {
          supabase.removeChannel(channel);
      };
  }, [profile, fetchDashboardData]);

  const handleFeatureClick = (path) => {
    if (path) {
        if (path.startsWith('http')) {
            window.open(path, '_blank');
        } else {
            navigate(path);
        }
    } else {
        toast({ title: "🚧 Bientôt disponible !", description: "Cette fonctionnalité est en cours de développement." });
    }
  };

  const mainFeatures = [
    { id: 'service-catalog', icon: Code, title: "Catalogue de Services", description: "Découvrez et réservez nos prestations.", onClick: () => handleFeatureClick("/service-catalog"), isLocked: false },
    { id: 'troubleshooting', icon: Wrench, title: "Dépannage Gratuit", description: "Un problème ? Créez un ticket.", onClick: () => handleFeatureClick("/troubleshooting"), isLocked: !hasSubscription },
    { id: 'promocodes', icon: Ticket, title: "Codes Promos", description: "Accédez à des réductions exclusives.", onClick: () => handleFeatureClick("/promocodes"), isLocked: !subscriptionDetails.access.promoCodes },
    { id: 'assistly-ia', icon: Bot, title: "Assistly IA", description: "Obtenez des réponses instantanées.", onClick: () => handleFeatureClick("/assistly-ia"), beta: false, isLocked: !subscriptionDetails.access.assistlyIA },
    { id: 'prioritysupport', icon: ShieldCheck, title: "Support Prioritaire", description: "Demandes traitées en priorité.", onClick: () => handleFeatureClick("/prioritysupport"), isLocked: !subscriptionDetails.access.prioritySupport },
    { id: 'devices', icon: Monitor, title: "Mes PC", description: "Gérez vos PC enregistrés.", onClick: () => handleFeatureClick("/devices"), isLocked: !hasSubscription },
  ];

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  const greeting = getGreeting();
  const disabledSections = profile?.disabled_sections || [];

  return (
    <>
      <Helmet><title>Tableau de Bord - Numerily</title></Helmet>
      <div className="w-full space-y-8">
        <AnimatePresence>
            {trackedRequests.length > 0 && (
                <motion.div layout className="space-y-4">
                    {(showAllTrackers ? trackedRequests : trackedRequests.slice(0, 1)).map(req => (
                        <ServiceTrackerBanner key={req.id} request={req} />
                    ))}
                    {trackedRequests.length > 1 && (
                        <Button variant="outline" onClick={() => setShowAllTrackers(!showAllTrackers)} className="w-full">
                            {showAllTrackers ? 'Voir moins' : `Voir ${trackedRequests.length - 1} autre(s) suivi(s)`}
                            {showAllTrackers ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                        </Button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
        {hasActiveTicket && <TroubleshootingBanner onPrepare={() => navigate('/prepare-troubleshooting')} />}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <div className="lg:col-span-2 flex flex-col gap-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-4xl font-bold text-foreground">{greeting} {profile.name || 'User'} !</h1>
                </motion.div>

                <Card className="flex-grow">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold text-foreground">Accès Rapide</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex-grow">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 h-full auto-rows-fr">
                            {mainFeatures.map((feature) => (
                                <FeatureCard key={feature.id} {...feature} isVisible={!disabledSections.includes(feature.id)} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-6">
                 {profile.beta_program ? (
                    <BetaProgramStatusCard onLeave={() => updateProfileBetaStatus(false)} />
                ) : (
                    <BetaProgramCard onJoin={() => updateProfileBetaStatus(true)} />
                )}
                <GuideCard />
            </div>
        </div>

        {!hasSubscription && (
            <SubscribeCard />
        )}

        <UserStats userId={profile.id} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
             <Card className="flex flex-col">
                <CardHeader><CardTitle className="text-xl flex items-center gap-2"><History className="w-6 h-6 text-foreground" />Activité Récente</CardTitle></CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-base text-muted-foreground mb-4">Vos 3 dernières actions sur la plateforme.</p>
                    {loadingActivities ? <Loader /> : (
                        activities.length > 0 ? (
                            <ul className="space-y-4">
                                {activities.map((act, i) => <ActivityItem key={act.id} activity={act} delay={i} />)}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-base text-center py-4">Aucune activité récente.</p>
                        )
                    )}
                </CardContent>
            </Card>
            <Card className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                      <Settings className="w-6 h-6 text-foreground"/>
                      <h3 className="text-xl font-bold text-foreground">Paramètres</h3>
                  </div>
                  <p className="text-base text-muted-foreground mb-4">Modifiez vos informations, gérez la visibilité des sections, et ajustez les notifications.</p>
                </div>
                <Button onClick={() => handleFeatureClick('/settings')} variant="secondary" className="w-full mt-4 text-base py-3">Accéder aux paramètres <ArrowRight className="ml-2 h-5 w-5"/></Button>
            </Card>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;