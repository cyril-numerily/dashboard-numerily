import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link as LinkIcon, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

import GeneralSettingsTab from '@/components/user/settings/GeneralSettingsTab';
import AffiliatedPartnerTab from '@/components/user/AffiliatedPartnerTab';
import BetaProgramSettingsTab from '@/components/user/settings/BetaProgramSettingsTab';

const SettingsPage = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    
    const tabs = [
        { id: 'general', icon: SettingsIcon, label: 'Général', component: <GeneralSettingsTab /> },
        { id: 'beta', icon: Sparkles, label: 'Programme Bêta', component: <BetaProgramSettingsTab /> },
    ];
    
    if (profile && profile.role === 'user' && profile.partner_id) {
         tabs.push({ id: 'partner', icon: LinkIcon, label: 'Partenaire Affilié', component: <AffiliatedPartnerTab /> });
    }

    return (
        <>
            <Helmet>
                <title>Paramètres - Numerily</title>
                <meta name="description" content="Gérez les paramètres de votre compte Numerily." />
            </Helmet>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                    <p className="text-muted-foreground">Personnalisez votre expérience et gérez votre compte.</p>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-8">
                    <TabsList className="flex-col justify-start h-auto p-2 bg-transparent w-full md:w-1/4 lg:w-1/5">
                        {tabs.map(tab => (
                            <TabsTrigger key={tab.id} value={tab.id} className="w-full justify-start gap-3 text-lg py-3 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="flex-1">
                        {tabs.map(tab => (
                             <TabsContent key={tab.id} value={tab.id} forceMount={true} className={activeTab === tab.id ? 'block' : 'hidden'}>
                                {tab.component}
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            </motion.div>
        </>
    );
};

export default SettingsPage;