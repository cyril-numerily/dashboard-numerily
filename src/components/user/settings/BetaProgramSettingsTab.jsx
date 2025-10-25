import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { BetaProgramCard, BetaProgramStatusCard } from '@/components/partner/BetaProgramCards';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

const BetaProgramSettingsTab = () => {
    const { profile, updateProfileBetaStatus } = useAuth();

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles /> Programme Bêta</CardTitle>
                    <CardDescription>
                        Accédez aux nouvelles fonctionnalités en avant-première et aidez-nous à construire le futur de Numerily.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {profile.beta_program ? (
                        <BetaProgramStatusCard onLeave={() => updateProfileBetaStatus(false)} />
                    ) : (
                        <BetaProgramCard onJoin={() => updateProfileBetaStatus(true)} />
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default BetaProgramSettingsTab;