import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const notificationTypes = [
    { id: 'new_message', label: 'Nouveaux messages du support', description: 'Lorsqu\'un admin vous envoie une réponse.' },
    { id: 'service_update', label: 'Mises à jour des services', description: 'Changements de statut pour vos demandes de service.' },
    { id: 'promotions', label: 'Promotions et nouveautés', description: 'Annonces marketing et nouvelles offres.' },
];

const NotificationsSettingsTab = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        new_message: { platform: true, email: false },
        service_update: { platform: true, email: true },
        promotions: { platform: true, email: true },
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        // This is a placeholder. In a real app, you'd fetch these from a `notification_settings` table.
        // For now, we'll use local state and simulate fetching.
        setTimeout(() => {
            // const { data, error } = await supabase.from('notification_settings').select('*').eq('user_id', user.id).single();
            // if (data) setSettings(data.preferences);
            setLoading(false);
        }, 500);
    }, [user]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleToggle = (type, medium) => {
        setSettings(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [medium]: !prev[type][medium],
            },
        }));
    };
    
    const handleSave = async () => {
        setSaving(true);
        // This is a placeholder for saving to DB.
        // const { error } = await supabase.from('notification_settings').upsert({ user_id: user.id, preferences: settings }, { onConflict: 'user_id' });
        setTimeout(() => {
            toast({ title: 'Succès', description: 'Préférences de notification mises à jour.' });
            setSaving(false);
        }, 1000);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
                <CardHeader>
                    <CardTitle>Préférences de Notification</CardTitle>
                    <CardDescription>Choisissez comment vous souhaitez être informé.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 font-semibold text-muted-foreground px-4">
                        <div className="col-start-2 text-center">Plateforme</div>
                        <div className="text-center">Email</div>
                    </div>
                    {notificationTypes.map(type => (
                        <div key={type.id} className="grid grid-cols-3 items-center gap-4 border-t pt-4">
                            <div>
                                <Label className="font-semibold">{type.label}</Label>
                                <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                            <div className="flex justify-center">
                                <Switch
                                    checked={settings[type.id].platform}
                                    onCheckedChange={() => handleToggle(type.id, 'platform')}
                                />
                            </div>
                            <div className="flex justify-center">
                                <Switch
                                    checked={settings[type.id].email}
                                    onCheckedChange={() => handleToggle(type.id, 'email')}
                                />
                            </div>
                        </div>
                    ))}
                     <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="animate-spin mr-2" /> : null}
                            Enregistrer les préférences
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default NotificationsSettingsTab;