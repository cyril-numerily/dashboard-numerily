import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const SecuritySettingsTab = () => {
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

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
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le mot de passe.' });
        } else {
            toast({ title: 'Succès', description: 'Mot de passe mis à jour.' });
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
                <CardHeader>
                    <CardTitle>Sécurité du Compte</CardTitle>
                    <CardDescription>Modifiez votre mot de passe et gérez les paramètres de sécurité.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                        <div>
                            <Label htmlFor="password">Nouveau mot de passe</Label>
                            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" disabled={loading}/>
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={loading}/>
                        </div>
                        <Button type="submit" disabled={loading || !password || password !== confirmPassword}>
                            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                            Mettre à jour le mot de passe
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default SecuritySettingsTab;