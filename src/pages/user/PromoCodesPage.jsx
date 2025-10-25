import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getSubscriptionDetails } from '@/config/subscriptions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Ticket, ShieldAlert, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';

const PremiumContentPage = ({ pageTitle, icon: Icon, children }) => {
    const { profile } = useAuth();
    const subscriptionDetails = getSubscriptionDetails(profile?.subscription);
    
    if (!subscriptionDetails.access.promoCodes) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="text-3xl font-bold text-foreground">Accès Exclusif Requis</h1>
                <p className="text-lg text-muted-foreground mt-2">Cette fonctionnalité est réservée aux abonnés Black et Gold.</p>
                <Button onClick={() => window.open('https://numerily.fr/prime', '_blank')} className="mt-6">Voir les abonnements</Button>
            </motion.div>
        );
    }

    return (
        <>
            <Helmet><title>{pageTitle} - Numerily</title></Helmet>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto space-y-8">
                 <div className="text-center">
                    <Icon className="mx-auto h-12 w-12 text-foreground mb-4" />
                    <h1 className="text-4xl font-bold text-foreground">{pageTitle}</h1>
                </div>
                {children}
            </motion.div>
        </>
    );
};

const PromoCodeCard = ({ code, value, type }) => {
    const { toast } = useToast();
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        toast({ title: 'Copié !', description: `Le code ${code} a été copié dans le presse-papiers.` });
    };

    const description = type === 'percentage' ? `${value}% de réduction` : `${value}€ de réduction`;

    return (
        <Card className="bg-secondary border-border rounded-lg">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="font-mono text-lg text-primary">{code}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                    <Copy className="h-5 w-5 text-foreground" />
                </Button>
            </CardContent>
        </Card>
    );
};

const PromoCodesPage = () => {
    const [promoCodes, setPromoCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchCodes = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les codes promo.' });
        } else {
            setPromoCodes(data || []);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchCodes();
    }, [fetchCodes]);

    return (
        <PremiumContentPage pageTitle="Mes Codes Promo" icon={Ticket}>
             <Card className="glass-effect rounded-xl bg-card">
                <CardHeader>
                    <CardTitle>Vos Avantages</CardTitle>
                    <CardDescription>Utilisez ces codes lors de vos prochaines commandes pour bénéficier de réductions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? <Loader /> : (
                        promoCodes.length > 0 ? (
                            promoCodes.map((promo) => (
                                <PromoCodeCard key={promo.id} {...promo} />
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-10">Aucun code promo disponible pour le moment.</p>
                        )
                    )}
                </CardContent>
            </Card>
        </PremiumContentPage>
    );
};

export default PromoCodesPage;