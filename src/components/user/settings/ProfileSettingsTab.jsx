import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProfileSettingsTab = () => {
    const { user, profile, refreshUserProfile } = useAuth();
    const { toast } = useToast();
    const avatarInputRef = useRef(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState({ profile: false, avatar: false });

    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
            setEmail(profile.email || '');
        }
    }, [profile]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(prev => ({ ...prev, profile: true }));

        const updates = {};
        if (name !== profile.name) updates.name = name;
        
        // Email update needs confirmation, handle separately if you want that flow
        // For now, let's assume email can be updated directly on profiles table.
        if (email !== profile.email) {
            updates.email = email;
            // You might want to update auth.users email too which is more complex
        }

        if (Object.keys(updates).length > 0) {
            const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
            if (error) {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le profil.' });
            } else {
                await refreshUserProfile();
                toast({ title: 'Succès', description: 'Profil mis à jour.' });
            }
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

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
                <CardHeader>
                    <CardTitle>Informations du Profil</CardTitle>
                    <CardDescription>Mettez à jour votre photo et vos informations personnelles ici.</CardDescription>
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
                        <Button type="submit" disabled={loading.profile}>
                            {loading.profile ? <Loader2 className="animate-spin mr-2" /> : null}
                            Enregistrer
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ProfileSettingsTab;