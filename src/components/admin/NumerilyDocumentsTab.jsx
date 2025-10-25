import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loader from '@/components/Loader';
import { Upload, Trash2, FileArchive, Download, Eye, Edit, Search, ArrowDownAZ, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

const EditDocumentDialog = ({ document, onUpdate }) => {
    const [name, setName] = useState(document.name);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        if (!name.trim()) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom ne peut pas être vide.' });
            return;
        }
        setIsSaving(true);
        const { error } = await supabase
            .from('partner_documents')
            .update({ name: name.trim() })
            .eq('id', document.id);
        
        setIsSaving(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le document.' });
        } else {
            toast({ title: 'Succès', description: 'Document mis à jour.' });
            onUpdate();
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Modifier le document</DialogTitle>
                <DialogDescription>
                    Renommez le document. Le fichier lui-même ne sera pas modifié.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Nom
                    </Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

const NumerilyDocumentsTab = () => {
    const { toast } = useToast();
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created_at');

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('partner_documents').select('*').order('created_at', { ascending: false });
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les documents.' });
        } else {
            setDocuments(data);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const filePath = `documents/${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
            .from('public-assets')
            .upload(filePath, file);

        if (uploadError) {
            toast({ variant: 'destructive', title: 'Erreur Upload', description: uploadError.message });
            setUploading(false);
            return;
        }

        const { data: publicUrlData } = supabase.storage.from('public-assets').getPublicUrl(filePath);

        const { error: dbError } = await supabase.from('partner_documents').insert({
            name: file.name,
            file_path: publicUrlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
        });

        if (dbError) {
            toast({ variant: 'destructive', title: 'Erreur DB', description: dbError.message });
        } else {
            toast({ title: 'Succès', description: 'Document téléversé.' });
            fetchDocuments();
        }
        setUploading(false);
        event.target.value = '';
    };

    const handleDelete = async (doc) => {
        const filePathFromUrl = new URL(doc.file_path).pathname.split('/public-assets/')[1];
        const { error: storageError } = await supabase.storage.from('public-assets').remove([filePathFromUrl]);
        if (storageError && storageError.statusCode !== '404' && !storageError.message.includes("Object not found")) {
            toast({ variant: 'destructive', title: 'Erreur Stockage', description: storageError.message });
            return;
        }
        const { error: dbError } = await supabase.from('partner_documents').delete().eq('id', doc.id);
        if (dbError) {
            toast({ variant: 'destructive', title: 'Erreur DB', description: dbError.message });
        } else {
            toast({ title: 'Succès', description: 'Document supprimé.' });
            fetchDocuments();
        }
    };

    const filteredAndSortedDocuments = useMemo(() => {
        return documents
            .filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (sortBy === 'name') {
                    return a.name.localeCompare(b.name);
                }
                return new Date(b.created_at) - new Date(a.created_at);
            });
    }, [documents, searchTerm, sortBy]);

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="text-center">
                 <div className="mx-auto bg-primary/10 p-3 rounded-full mb-2">
                    <FileArchive className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Documents Partenaires</CardTitle>
                <CardDescription>Partagez des ressources importantes avec vos partenaires.</CardDescription>
            </CardHeader>
            <CardContent className="max-w-3xl mx-auto space-y-6">
                 <div className="border border-dashed border-border rounded-lg p-6 text-center">
                    <label htmlFor="doc-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                        <h3 className="mt-2 text-lg font-medium text-foreground">
                            {uploading ? 'Téléversement en cours...' : 'Cliquez pour téléverser'}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX, PNG, JPG, etc.</p>
                    </label>
                    <Input id="doc-upload" type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un document..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant={sortBy === 'created_at' ? 'default' : 'outline'} onClick={() => setSortBy('created_at')} className="gap-2">
                            <Clock className="h-4 w-4" /> Récents
                        </Button>
                        <Button variant={sortBy === 'name' ? 'default' : 'outline'} onClick={() => setSortBy('name')} className="gap-2">
                            <ArrowDownAZ className="h-4 w-4" /> Nom
                        </Button>
                    </div>
                </div>

                {loading ? <div className="flex justify-center py-8"><Loader /></div> : (
                    filteredAndSortedDocuments.length > 0 ? (
                        <ul className="space-y-3">
                            {filteredAndSortedDocuments.map(doc => (
                                <Dialog key={doc.id}>
                                    <li className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                                        <span className="text-base text-foreground font-medium truncate pr-4">{doc.name}</span>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={doc.file_path} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 text-muted-foreground" /></a>
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={doc.file_path} download><Download className="h-4 w-4 text-muted-foreground" /></a>
                                            </Button>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DialogTrigger>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </li>
                                    <EditDocumentDialog document={doc} onUpdate={fetchDocuments} />
                                </Dialog>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">Aucun document ne correspond à votre recherche.</p>
                    )
                )}
            </CardContent>
        </Card>
    );
};

export default NumerilyDocumentsTab;