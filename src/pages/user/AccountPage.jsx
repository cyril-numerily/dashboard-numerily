import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { User, Lock, CreditCard, Loader2, ExternalLink, Check, Upload, Shield, Briefcase, Link2Off, UserCheck, Trash2, AlertTriangle } from 'lucide-react';
import { getSubscriptionDetails } from '@/config/subscriptions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';

const AccountPage = () => {
    const { profile, user, refreshUserProfile, loading: authLoading, signOut, clearLocalSession } = useAuth();
    const { toast } = useToast();
    const avatarInputRef = useRef(null);
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState({ profile: false, password: false, avatar: false, delete: false });
    const [partnerInfo, setPartnerInfo] = useState(null);
    const [loadingPartner, setLoadingPartner] = useState(true);
    const [dissociateLoading, setDissociateLoading] = useState(false);
    const [deleteConfirmationChecked, setDeleteConfirmationChecked] = useState(false);
    
    const fetchPartnerInfo = useCallback(async (partnerId) => {
        setLoadingPartner(true);
        const { data, error } = await supabase.from('profiles').select('name, email, avatar_url').eq('id', partnerId).single();
        if (!error) {
            setPartnerInfo(data);
        } else {
            setPartnerInfo(null);
        }
        setLoadingPartner(false);
    }, []);

    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
            if (profile.partner_id) {
                fetchPartnerInfo(profile.partner_id);
            } else {
                setPartnerInfo(null);
                setLoadingPartner(false);
            }
        }
    }, [profile, fetchPartnerInfo]);

    const handleDissociateFromPartner = async () => {
        setDissociateLoading(true);
        const { error } = await supabase.from('profiles').update({ partner_id: null }).eq('id', user.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de se dissocier du partenaire.' });
        } else {
            await refreshUserProfile();
            toast({ title: 'Succès', description: 'Vous avez été dissocié de votre partenaire.' });
        }
        setDissociateLoading(false);
    };
    
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(prev => ({ ...prev, profile: true }));
        const { error: profileError } = await supabase.from('profiles').update({ name }).eq('id', user.id);
        if (profileError) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le profil.' });
        } else {
            await refreshUserProfile();
            toast({ title: 'Succès', description: 'Profil mis à jour.' });
        }
        setLoading(prev => ({ ...prev, profile: false }));
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Les mots de passe ne correspondent pas.' });
            return;
        }
        if (password.length < 6) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Le mot de passe doit contenir au moins 6 caractères.' });
            return;
        }
        setLoading(prev => ({ ...prev, password: true }));
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le mot de passe.' });
        } else {
            toast({ title: 'Succès', description: 'Mot de passe mis à jour.' });
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(prev => ({ ...prev, password: false }));
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setLoading(prev => ({...prev, avatar: true}));
        const filePath = `${user.id}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
        if (uploadError) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de téléverser l'avatar." });
        } else {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: `${publicUrl}?t=${new Date().getTime()}` }).eq('id', user.id);
            if (updateError) {
                toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de mettre à jour l'URL de l'avatar." });
            } else {
                await refreshUserProfile();
                toast({ title: 'Succès', description: 'Photo de profil mise à jour.' });
            }
        }
        setLoading(prev => ({...prev, avatar: false}));
    };

    const handleDeleteAccount = async () => {
        setLoading(prev => ({ ...prev, delete: true }));
        try {
            const { error } = await supabase.functions.invoke('delete-user', {
                body: { user_id_to_delete: user.id }
            });

            if (error) throw error;
            
            toast({ title: 'Compte supprimé', description: 'Votre compte et toutes vos données ont été supprimés.' });
            clearLocalSession();
            navigate('/', {replace: true});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer le compte. ' + error.message });
        } finally {
            setLoading(prev => ({ ...prev, delete: false }));
        }
    };

    if (authLoading || !profile) {
        return <div className="min-h-screen flex items-center justify-center"><Loader size="lg" /></div>;
    }
    
    const subscriptionDetails = getSubscriptionDetails(profile.subscription);

    const roleDetails = {
        admin: { icon: Shield, title: "Administrateur", description: "Accès complet à la gestion de la plateforme." },
        partner: { icon: Briefcase, title: "Partenaire", description: "Accès au portail pour gérer clients et commissions." }
    };
    const currentRole = roleDetails[profile.role];

    return (
        <>
            <Helmet><title>Mon Compte - Numerily</title></Helmet>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="relative inline-block"
                    >
                        <Avatar className="h-32 w-32 mx-auto border-4 border-background shadow-xl">
                            <AvatarImage src={profile.avatar_url} alt={profile.name} />
                            <AvatarFallback className="text-5xl">{profile.name ? profile.name.charAt(0).toUpperCase() : <User />}</AvatarFallback>
                        </Avatar>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="absolute bottom-1 right-1 rounded-full h-10 w-10 border-2 border-background"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={loading.avatar}
                        >
                            {loading.avatar ? <Loader2 className="animate-spin h-5 w-5" /> : <Upload className="h-5 w-5" />}
                        </Button>
                        <Input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/png, image/jpeg" className="hidden" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-foreground mt-5">{profile.name}</h1>
                    <p className="text-lg text-muted-foreground">{user?.email}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User /> Informations Personnelles</CardTitle>
                        <CardDescription>Mettez à jour votre nom et votre mot de passe.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                             <div>
                                <Label htmlFor="name">Nom complet</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <Button type="submit" disabled={loading.profile}>
                                {loading.profile ? <Loader2 className="animate-spin" /> : 'Enregistrer les modifications'}
                            </Button>
                        </form>
                        <div className="border-t border-border my-6"></div>
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <div>
                                <Label htmlFor="password">Nouveau mot de passe</Label>
                                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                            <div>
                                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                            <Button type="submit" disabled={loading.password}>
                                {loading.password ? <Loader2 className="animate-spin" /> : 'Mettre à jour le mot de passe'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {profile.role === 'user' ? (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2"><CreditCard /> Abonnement {subscriptionDetails.name}</CardTitle>
                                <CardDescription>Gérez votre abonnement et vos avantages.</CardDescription>
                            </div>
                            {subscriptionDetails.iconUrl && (
                                <img src={subscriptionDetails.iconUrl} alt={`${subscriptionDetails.name} icon`} className="w-16 h-16"/>
                            )}
                        </CardHeader>
                        <CardContent>
                             <ul className="space-y-3 text-sm mb-6">
                                 {subscriptionDetails.features.map((feature, i) => (
                                     <li key={i} className="flex items-center gap-3"><Check className="w-4 h-4 text-primary flex-shrink-0" /><span>{feature}</span></li>
                                 ))}
                             </ul>
                             <Button onClick={() => window.open('https://billing.stripe.com/p/login/eVa3do9YM74Pdy09AA', '_blank')} className="w-full">
                                 Gérer mon abonnement <ExternalLink className="ml-2 h-4 w-4" />
                             </Button>
                        </CardContent>
                    </Card>
                ) : (
                    currentRole && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><currentRole.icon /> {currentRole.title}</CardTitle>
                                <CardDescription>{currentRole.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    )
                )}

                {profile.role === 'user' && profile.partner_id && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><UserCheck /> Partenaire affilié</CardTitle>
                            <CardDescription>Informations sur votre partenaire et gestion de l'affiliation.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingPartner ? <Loader /> : partnerInfo ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={partnerInfo.avatar_url} />
                                            <AvatarFallback>{partnerInfo.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{partnerInfo.name}</p>
                                            <p className="text-sm text-muted-foreground">{partnerInfo.email}</p>
                                        </div>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm"><Link2Off className="mr-2 h-4 w-4" /> Se dissocier</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Cette action est irréversible. Vous ne serez plus affilié à ce partenaire et il ne pourra plus gérer vos services.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDissociateFromPartner} disabled={dissociateLoading}>
                                                    {dissociateLoading ? <Loader2 className="animate-spin" /> : "Confirmer"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Impossible de charger les informations du partenaire.</p>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><Trash2 /> Zone de Danger</CardTitle>
                        <CardDescription>Cette action est irréversible. Toutes vos données seront définitivement supprimées.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog onOpenChange={() => setDeleteConfirmationChecked(false)}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Supprimer mon compte</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action ne peut pas être annulée. Cela supprimera définitivement votre compte et toutes vos données de nos serveurs.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 rounded-md my-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                                <b>Important :</b> La suppression de votre compte ne met pas fin à vos abonnements actifs. Vous devez les gérer séparément via notre portail de facturation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 mt-4">
                                    <Checkbox id="delete-confirm" onCheckedChange={setDeleteConfirmationChecked} checked={deleteConfirmationChecked} />
                                    <label
                                        htmlFor="delete-confirm"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Je comprends que mes abonnements ne seront pas annulés.
                                    </label>
                                </div>

                                <AlertDialogFooter className="mt-4">
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAccount} disabled={loading.delete || !deleteConfirmationChecked}>
                                        {loading.delete ? <Loader2 className="animate-spin" /> : "Je comprends, supprimer mon compte"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </motion.div>
        </>
    );
};

export default AccountPage;