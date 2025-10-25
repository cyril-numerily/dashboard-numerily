import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Bot } from 'lucide-react';
import Loader from '@/components/Loader';
import { getSubscriptionDetails } from '@/config/subscriptions';

const PremiumContentPage = ({ pageTitle, icon: Icon, children }) => {
    const { profile, loading } = useAuth();
    
    if (loading) {
        return <div className="h-screen flex items-center justify-center"><Loader size="lg" /></div>;
    }
    
    const subscriptionDetails = getSubscriptionDetails(profile?.subscription);
    const hasAccess = subscriptionDetails.access.assistlyIA;

    if (!hasAccess) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="text-3xl font-bold text-foreground">Accès Exclusif Requis</h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Cette fonctionnalité est réservée aux abonnés Black et Gold.
                </p>
                <Button onClick={() => window.open('https://numerily.fr/prime', '_blank')} className="mt-6">Voir les abonnements</Button>
            </motion.div>
        );
    }

    return (
        <>
            <Helmet><title>{pageTitle} - Numerily</title></Helmet>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full h-[80vh] flex flex-col">
                 <div className="text-center mb-8 flex items-center justify-center gap-4">
                    <img src="https://horizons-cdn.hostinger.com/1dfec302-4fd6-4f8b-a330-41699fd1c70b/ddcd80be4b716de1ad123fd8342d5a30.png" alt="Assistly IA Logo" className="h-12 w-12" />
                    <h1 className="text-4xl font-bold text-foreground">{pageTitle}</h1>
                </div>
                {children}
            </motion.div>
        </>
    );
};


const AssistlyIAPage = () => {
    const botpressUrl = "https://cdn.botpress.cloud/webchat/v3.2/shareable.html?configUrl=https://files.bpcontent.cloud/2025/08/17/00/20250817002421-IAZIZFL3.json";

    return (
        <PremiumContentPage pageTitle="Assistly IA" icon={Bot}>
            <div className="flex-grow w-full h-full rounded-2xl overflow-hidden glass-effect p-1 bg-card">
                 <iframe
                    src={botpressUrl}
                    width="100%"
                    height="100%"
                    className="border-0 rounded-xl"
                    title="Assistly IA Chatbot"
                ></iframe>
            </div>
        </PremiumContentPage>
    );
};

export default AssistlyIAPage;