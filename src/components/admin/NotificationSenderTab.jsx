import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Send, Link as LinkIcon, BellRing } from 'lucide-react';

const NotificationSenderTab = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ title: '', message: '', target_segment: 'all', link_url: '' });

    const handleSend = async () => {
        if (!notification.title || !notification.message) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Le titre et le message sont requis.' });
            return;
        }
        setLoading(true);
        const { error } = await supabase.from('notifications').insert({
            ...notification,
            link_url: notification.link_url || null,
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'envoyer la notification." });
        } else {
            toast({ title: 'Succès', description: 'Notification envoyée avec succès !' });
            setNotification({ title: '', message: '', target_segment: 'all', link_url: '' });
        }
        setLoading(false);
    };

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full mb-2">
                    <BellRing className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Créer une Notification</CardTitle>
                <CardDescription>Envoyez des alertes et des informations à vos utilisateurs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-w-lg mx-auto">
                <div className="space-y-2">
                    <Label htmlFor="notif-title" className="text-base">Titre</Label>
                    <Input id="notif-title" value={notification.title} onChange={(e) => setNotification({...notification, title: e.target.value})} placeholder="Ex: Maintenance importante" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notif-message" className="text-base">Message</Label>
                    <Textarea id="notif-message" value={notification.message} onChange={(e) => setNotification({...notification, message: e.target.value})} placeholder="Décrivez votre notification..." />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="notif-link" className="text-base flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" /> Lien (Optionnel)
                    </Label>
                    <Input id="notif-link" type="url" value={notification.link_url} onChange={(e) => setNotification({...notification, link_url: e.target.value})} placeholder="https://exemple.com/page-importante" />
                </div>
                <div className="space-y-2">
                    <Label className="text-base">Cible</Label>
                    <Select value={notification.target_segment} onValueChange={(val) => setNotification({...notification, target_segment: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les utilisateurs</SelectItem>
                            <SelectItem value="user">Clients</SelectItem>
                            <SelectItem value="partner">Partenaires</SelectItem>
                            <SelectItem value="silver">Abonnés Silver+</SelectItem>
                            <SelectItem value="gold">Abonnés Gold+</SelectItem>
                            <SelectItem value="black">Abonnés Black</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleSend} disabled={loading} className="w-full text-lg py-6">
                    <Send className="mr-2 h-5 w-5" /> {loading ? "Envoi en cours..." : "Envoyer la Notification"}
                </Button>
            </CardContent>
        </Card>
    );
};

export default NotificationSenderTab;