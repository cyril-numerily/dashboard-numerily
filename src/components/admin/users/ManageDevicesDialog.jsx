import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Loader2, Monitor, Laptop, Server, Hash } from 'lucide-react';

const deviceIcons = {
    desktop: <Monitor className="w-6 h-6 text-primary" />,
    laptop: <Laptop className="w-6 h-6 text-primary" />,
    server: <Server className="w-6 h-6 text-primary" />,
    other: <Monitor className="w-6 h-6 text-primary" />,
};

const ManageDevicesDialog = ({ user, onDevicesUpdated, open, setOpen }) => {
    const { toast } = useToast();
    const [devices, setDevices] = useState(user.devices || []);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        setDevices(user.devices || []);
    }, [user]);

    const handleDeleteDevice = async (deviceId) => {
        setDeletingId(deviceId);
        try {
            const updatedDevices = devices.filter(d => d.id !== deviceId);
            const { error } = await supabase
                .from('profiles')
                .update({ devices: updatedDevices })
                .eq('id', user.id);

            if (error) throw error;
            toast({ title: "Succès", description: "Appareil supprimé." });
            setDevices(updatedDevices);
            onDevicesUpdated(user.id, updatedDevices);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer l\'appareil.' });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gérer les PC de {user.name}</DialogTitle>
                    <DialogDescription>
                        Vous pouvez voir et supprimer les appareils enregistrés pour cet utilisateur.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                    {devices.length > 0 ? (
                        devices.map(device => (
                            <div key={device.id} className="flex items-center justify-between p-3 rounded-md border">
                                <div className="flex items-center gap-3">
                                    {deviceIcons[device.type] || deviceIcons.other}
                                    <div>
                                        <p className="font-semibold">{device.name}</p>
                                        <p className="text-sm capitalize text-muted-foreground">{device.type}</p>
                                        {device.serialNumber && (
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <Hash className="h-3 w-3" /> {device.serialNumber}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteDevice(device.id)} disabled={deletingId === device.id}>
                                    {deletingId === device.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8">Cet utilisateur n'a aucun appareil enregistré.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ManageDevicesDialog;