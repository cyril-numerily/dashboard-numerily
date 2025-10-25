import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, BookOpenCheck, CheckCircle, MessageSquare, PieChart, ShoppingCart, Truck, Users, History, Settings, Lock } from 'lucide-react';
import { BetaProgramCard, BetaProgramStatusCard } from './BetaProgramCards';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
};

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
    );
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
        { icon: Users, title: "Ajoutez vos clients", description: "Utilisez la section 'Mes Clients' pour enregistrer de nouveaux utilisateurs." },
        { icon: ShoppingCart, title: "Commandez pour eux", description: "Accédez au catalogue pour commander des services en leur nom." },
        { icon: PieChart, title: "Suivez vos gains", description: "Consultez le tableau des commissions pour voir vos revenus." },
    ];
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><BookOpenCheck className="w-6 h-6 text-foreground" /> Guide du Partenaire</CardTitle>
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

const PartnerDashboard = ({ profile, activities }) => {
    const { toast } = useToast();
    const { updateProfileBetaStatus } = useAuth();
    const navigate = useNavigate();

    const handleFeatureClick = (path) => {
        if (path) {
            navigate(path);
        } else {
            toast({
                title: "🚧 Bientôt disponible !",
                description: "Cette fonctionnalité est en cours de développement.",
            });
        }
    };

    const mainFeatures = [
        { id: 'clients', icon: Users, title: "Mes Clients", description: "Gérez votre portefeuille de clients.", onClick: () => handleFeatureClick("/partner/clients"), isLocked: false },
        { id: 'tracking', icon: Truck, title: "Suivi des Services", description: "Suivez l'avancement des services.", onClick: () => handleFeatureClick("/partner/tracking"), isLocked: false },
        { id: 'commissions', icon: PieChart, title: "Commissions", description: "Consultez vos gains et historiques.", onClick: () => handleFeatureClick("/partner/commissions"), isLocked: false },
        { id: 'catalog', icon: ShoppingCart, title: "Commander", description: "Accédez au catalogue pour vos clients.", onClick: () => handleFeatureClick("/service-catalog"), isLocked: false },
        { id: 'contact', icon: MessageSquare, title: "Contacter l'Admin", description: "Échangez avec l'équipe Numerily.", onClick: () => handleFeatureClick("/partner/contact"), isLocked: false },
        { id: 'documents', icon: BookOpen, title: "Ressources", description: "Documentation et guides pour vous.", onClick: () => handleFeatureClick("/partner/documents"), isLocked: false },
    ];

    const greeting = getGreeting();
    const disabledSections = profile?.disabled_sections || [];

    return (
        <div className="w-full space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                         <h1 className="text-4xl font-bold text-foreground">{greeting}, {profile.name || 'Partenaire'} !</h1>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
                <Card className="flex flex-col">
                    <CardHeader><CardTitle className="text-xl flex items-center gap-2"><History className="w-6 h-6 text-foreground" />Votre Activité Récente</CardTitle></CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-base text-muted-foreground mb-4">Vos 3 dernières actions sur la plateforme.</p>
                        {activities && activities.length > 0 ? (
                            <ul className="space-y-4">
                                {activities.map((act, i) => <ActivityItem key={act.id} activity={act} delay={i} />)}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-base text-center py-4">Aucune activité récente.</p>
                        )}
                    </CardContent>
                </Card>
                <Card className="p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Settings className="w-6 h-6 text-foreground"/>
                            <h3 className="text-xl font-bold text-foreground">Paramètres</h3>
                        </div>
                        <p className="text-base text-muted-foreground mb-4">Modifiez vos informations et gérez la visibilité des sections.</p>
                    </div>
                    <Button onClick={() => handleFeatureClick('/settings')} className="w-full mt-4 text-base py-3">Accéder aux paramètres <ArrowRight className="ml-2 h-5 w-5"/></Button>
                </Card>
            </div>
        </div>
    );
};

export default PartnerDashboard;