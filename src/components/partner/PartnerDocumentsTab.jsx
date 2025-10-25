import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loader from '@/components/Loader';
import { Download, FileArchive, Search, ArrowDownAZ, Clock } from 'lucide-react';

const PartnerDocumentsTab = () => {
    const { toast } = useToast();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created_at');

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('partner_documents').select('*');
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

    const handleDownload = (filePath, fileName) => {
        const a = document.createElement('a');
        a.href = filePath;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileArchive className="w-5 h-5 text-white" />Ressources & Documents</CardTitle>
                    <CardDescription>Retrouvez ici tous les documents utiles partagés par l'équipe Numerily.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                                    <li key={doc.id} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                                        <span className="text-sm font-medium text-foreground truncate pr-4">{doc.name}</span>
                                        <Button size="sm" variant="outline" onClick={() => handleDownload(doc.file_path, doc.name)}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Télécharger
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">Aucun document disponible pour le moment.</p>
                        )
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default PartnerDocumentsTab;