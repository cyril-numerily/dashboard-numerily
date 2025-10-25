import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserCheck, Shield, Link, HelpCircle, AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AffiliatedPartnerTab = () => {
    const { profile, user, refreshUserProfile } = useAuth();
    const { toast } = useToast();
    const [partnerInfo, setPartnerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dissociating, setDissociating] = useState(false);

    const fetchPartnerInfo = useCallback(async () => {
        if (!profile || !profile.partner_id) {
            setLoading(false);
            setPartnerInfo(null);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('name, email, avatar_url')
                .eq('id', profile.partner_id)
                .single();

            if (error) throw error;
            setPartnerInfo(data);
        } catch (error) {
            console.error("Error fetching partner info:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les informations du partenaire." });
            setPartnerInfo(null);
        } finally {
            setLoading(false);
        }
    }, [profile, toast]);

    useEffect(() => {
        fetchPartnerInfo();
    }, [fetchPartnerInfo]);

    const handleDissociate = async () => {
        setDissociating(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ partner_id: null })
                .eq('id', user.id);

            if (error) throw error;

            await refreshUserProfile();
            toast({ title: "Succès", description: "Vous avez été dissocié de votre partenaire." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de se dissocier du partenaire." });
        } finally {
            setDissociating(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader /></div>;
    
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Link className="w-5 h-5" />Partenaire Affilié</CardTitle>
                    <CardDescription>Informations sur le partenaire gérant votre compte et les actions que vous pouvez entreprendre.</CardDescription>
                </CardHeader>
                <CardContent>
                    {partnerInfo ? (
                        <div className="flex items-center gap-4">
                            <UserCheck className="w-10 h-10 text-primary" />
                            <div>
                                <p className="font-semibold text-lg">{partnerInfo.name}</p>
                                <p className="text-muted-foreground">{partnerInfo.email}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Aucun partenaire n'est actuellement affilié à votre compte.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Droits et Accès du Partenaire</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-muted-foreground">
                        Votre partenaire dispose de permissions spécifiques pour vous aider à gérer vos services. Voici ce qu'il peut faire :
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Commander de nouveaux services ou dépannages en votre nom.</li>
                        <li>Consulter l'historique et le statut de vos demandes de service.</li>
                        <li>Accéder aux informations de base de votre profil (nom et email) pour vous identifier.</li>
                    </ul>
                    <p className="mt-4 font-semibold">
                        Votre partenaire ne peut PAS modifier vos informations personnelles, votre mot de passe, ou gérer vos abonnements.
                    </p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><HelpCircle className="w-5 h-5" />Foire aux Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Comment un partenaire est-il affilié à mon compte ?</h4>
                        <p className="text-muted-foreground">Un partenaire vous est affilié s'il a créé votre compte pour vous ou si vous avez utilisé un lien d'affiliation fourni par lui.</p>
                    </div>
                     <div>
                        <h4 className="font-semibold">Que faire si je ne reconnais pas ce partenaire ?</h4>
                        <p className="text-muted-foreground">Si vous pensez qu'il y a une erreur, vous pouvez vous dissocier à tout moment. Cela rompra le lien entre vos comptes.</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-orange-500/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-500"><AlertTriangle className="w-5 h-5" />Dissocier le Partenaire</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-muted-foreground">
                        Si vous souhaitez reprendre la gestion complète de votre compte ou changer de partenaire, vous pouvez vous dissocier. Cette action est irréversible et le partenaire perdra tout accès.
                    </p>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600">
                                Dissocier le partenaire
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr de vouloir vous dissocier ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action est irréversible. Votre partenaire actuel perdra l'accès à la gestion de votre compte. Vous pourrez toujours vous affilier à un autre partenaire plus tard si vous le souhaitez.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDissociate} disabled={dissociating} className="bg-destructive hover:bg-destructive/90">
                                    {dissociating ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Oui, dissocier
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>

        </motion.div>
    );
};

export default AffiliatedPartnerTab;