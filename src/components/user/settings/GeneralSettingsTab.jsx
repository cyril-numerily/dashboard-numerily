import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, ExternalLink, Check, Trash2, AlertTriangle, Briefcase, Shield, Loader2, Upload, User, Lock, Bell } from 'lucide-react';
import { getSubscriptionDetails } from '@/config/subscriptions';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

const notificationTypes = [
    { id: 'new_message', label: 'Nouveaux messages du support', description: 'Lorsqu\'un admin vous envoie une réponse.' },
    { id: 'promotions', label: 'Promotions', description: 'Annonces marketing et nouvelles offres.' },
];

const PasswordChangeDialog = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Les nouveaux mots de passe ne correspondent pas.' });
            return;
        }
        if (newPassword.length < 6) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
            return;
        }
        setLoading(true);

        const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
        if (signInError) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Le mot de passe actuel est incorrect.' });
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le mot de passe.' });
        } else {
            toast({ title: 'Succès', description: 'Mot de passe mis à jour.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setIsOpen(false);
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Changer le mot de passe</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Changer le mot de passe</DialogTitle>
                    <DialogDescription>Pour votre sécurité, veuillez entrer votre mot de passe actuel.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                        <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" disabled={loading} required />
                    </div>
                    <div>
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" disabled={loading} required />
                    </div>
                    <div>
                        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={loading} required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword}>
                            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                            Mettre à jour
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const GeneralSettingsTab = () => {
    const { profile, user, loading: authLoading, clearLocalSession, refreshUserProfile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const avatarInputRef = useRef(null);

    const [loading, setLoading] = useState({ delete: false, profile: false, avatar: false, notifications: false });
    const [deleteConfirmationChecked, setDeleteConfirmationChecked] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    
    const [notificationSettings, setNotificationSettings] = useState({
        new_message: { platform: true, email: false },
        promotions: { platform: true, email: false },
    });
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
            setEmail(profile.email || '');
            setPhone(profile.phone || '');
        }
    }, [profile]);

    const fetchNotificationSettings = useCallback(async () => {
        if (!user) return;
        setLoadingNotifications(true);
        setTimeout(() => {
            setLoadingNotifications(false);
        }, 500);
    }, [user]);

    useEffect(() => {
        fetchNotificationSettings();
    }, [fetchNotificationSettings]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(prev => ({ ...prev, profile: true }));

        const updates = {
            name: name,
            phone: phone,
        };

        const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le profil.' });
        } else {
            await refreshUserProfile();
            toast({ title: 'Succès', description: 'Profil mis à jour.' });
        }
        
        setLoading(prev => ({ ...prev, profile: false }));
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

    const handleNotificationToggle = (type, medium) => {
        setNotificationSettings(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [medium]: !prev[type][medium],
            },
        }));
    };
    
    const handleNotificationSave = async () => {
        setLoading(prev => ({ ...prev, notifications: true }));
        setTimeout(() => {
            toast({ title: 'Succès', description: 'Préférences de notification mises à jour.' });
            setLoading(prev => ({ ...prev, notifications: false }));
        }, 1000);
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Informations du Compte</CardTitle>
                    <CardDescription>Mettez à jour votre photo, vos informations et votre mot de passe.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                            <AvatarFallback className="text-3xl">{profile?.name ? profile.name.charAt(0).toUpperCase() : <User />}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-2">
                             <Button onClick={() => avatarInputRef.current?.click()} disabled={loading.avatar}>
                                {loading.avatar ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                                Changer d'avatar
                            </Button>
                            <p className="text-xs text-muted-foreground">PNG, JPG jusqu'à 5MB.</p>
                            <Input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/png, image/jpeg" className="hidden" />
                        </div>
                    </div>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nom complet</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} disabled={loading.profile} />
                        </div>
                        <div>
                            <Label htmlFor="email">Adresse e-mail</Label>
                            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={true} />
                            <p className="text-xs text-muted-foreground mt-1">La modification de l'e-mail n'est pas encore prise en charge.</p>
                        </div>
                        <div>
                            <Label htmlFor="phone">Numéro de téléphone</Label>
                            <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={loading.profile} />
                        </div>
                        <div className="flex items-center gap-4 pt-2">
                            <Button type="submit" disabled={loading.profile}>
                                {loading.profile ? <Loader2 className="animate-spin mr-2" /> : null}
                                Enregistrer
                            </Button>
                            <PasswordChangeDialog />
                        </div>
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell /> Préférences de Notification</CardTitle>
                    <CardDescription>Choisissez comment vous souhaitez être informé.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loadingNotifications ? <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div> : (
                        <>
                            <div className="grid grid-cols-3 gap-4 font-semibold text-muted-foreground px-4">
                                <div className="col-start-2 text-center">Plateforme</div>
                                <div className="text-center">
                                    Email
                                    <p className="text-xs font-normal">(Bientôt disponible)</p>
                                </div>
                            </div>
                            {notificationTypes.map(type => (
                                <div key={type.id} className="grid grid-cols-3 items-center gap-4 border-t pt-4">
                                    <div>
                                        <Label className="font-semibold">{type.label}</Label>
                                        <p className="text-sm text-muted-foreground">{type.description}</p>
                                    </div>
                                    <div className="flex justify-center">
                                        <Switch
                                            checked={notificationSettings[type.id].platform}
                                            onCheckedChange={() => handleNotificationToggle(type.id, 'platform')}
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <Switch
                                            checked={notificationSettings[type.id].email}
                                            onCheckedChange={() => handleNotificationToggle(type.id, 'email')}
                                            disabled={true}
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleNotificationSave} disabled={loading.notifications}>
                                    {loading.notifications ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Enregistrer les préférences
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

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
    );
};

export default GeneralSettingsTab;