import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Wrench, User, Mail, Tag, MessageSquare, Calendar, Euro, Hash, Search, ChevronLeft, ChevronRight, MoreHorizontal, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusVariant = {
  'Nouvelle': 'default', 'Nouveau': 'default',
  'En cours': 'secondary',
  'Validée': 'outline', 'Résolu': 'outline',
  'Annulée': 'destructive', 'Fermé': 'destructive',
};

const RequestDetailsDialog = ({ request, isOpen, onOpenChange, type, onStatusChange, onStepChange }) => {
    if (!request) return null;

    const isServiceRequest = type === 'requests';
    const isTroubleshootingTicket = type === 'tickets';
    const bannerConfig = request.services?.custom_banner_config;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Détails de la {isServiceRequest ? 'demande' : 'ticket'}</DialogTitle>
                    <DialogDescription>
                        Informations complètes sur la {isServiceRequest ? `demande de ${request.service_title}` : `ticket de ${request.category}`}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                        <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> Client</span>
                        <span>{request.user_name || 'N/A'}</span>
                    </div>
                     <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                        <span className="text-muted-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> Email Client</span>
                        <span>{request.user_email || 'N/A'}</span>
                    </div>
                    {isServiceRequest && (
                        <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                            <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> Demandé par</span>
                            <span>{request.requested_by_role === 'partner' ? request.requester?.name || 'Partenaire' : 'Client'}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                        <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
                        <span>{new Date(request.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                     {isTroubleshootingTicket && request.device?.serialNumber && (
                        <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                            <span className="text-muted-foreground flex items-center gap-2"><Hash className="w-4 h-4" /> Numéro de série</span>
                            <span>{request.device.serialNumber}</span>
                        </div>
                    )}
                    {isServiceRequest && request.promo_code && (
                         <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                            <span className="text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4" /> Code Promo</span>
                            <Badge variant="secondary">{request.promo_code}</Badge>
                        </div>
                    )}
                    {isServiceRequest && (
                        <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                            <span className="text-muted-foreground flex items-center gap-2"><Euro className="w-4 h-4" /> Prix Final</span>
                            <span>{request.final_price?.toFixed(2)} €</span>
                        </div>
                    )}
                    <div className="grid grid-cols-1 items-start gap-2">
                        <span className="text-muted-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4" /> {isServiceRequest ? 'Détails supplémentaires' : 'Description du problème'}</span>
                        <p className="p-3 bg-secondary rounded-md text-sm">{isServiceRequest ? request.details || 'Aucun détail' : request.description || 'Aucune description'}</p>
                    </div>
                    {isServiceRequest && bannerConfig?.enabled && (
                        <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                            <span className="text-muted-foreground flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Étape de suivi</span>
                            <Select value={request.current_banner_step} onValueChange={(newStep) => onStepChange(request.id, parseInt(newStep))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir une étape" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bannerConfig.steps.map((step, index) => (
                                        <SelectItem key={index} value={index}>{step.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ITEMS_PER_PAGE = 9;

const RequestCard = ({ request, onStatusChange, onCardClick, statusOptions, table }) => {
    return (
        <Card className="flex flex-col justify-between hover:shadow-lg hover:shadow-primary/10 transition-shadow duration-300">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base font-semibold leading-tight truncate">{table === 'service_requests' ? request.service_title : request.device?.name || request.category}</CardTitle>
                        <CardDescription className="text-xs mt-1">{new Date(request.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</CardDescription>
                    </div>
                    {table === 'service_requests' && <Badge variant="outline">{request.final_price?.toFixed(2)} €</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate font-medium text-foreground">{request.user_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{request.user_email || 'N/A'}</span>
                </div>
                {table === 'service_requests' && request.requested_by_role === 'partner' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="truncate">via {request.requester?.name || 'Partenaire'}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <div onClick={(e) => e.stopPropagation()}>
                    <Select value={request.status} onValueChange={(newStatus) => onStatusChange(request.id, newStatus, table)}>
                        <SelectTrigger className="w-32 text-xs h-8">
                            <SelectValue>
                                <Badge variant={statusVariant[request.status] || 'default'} className="text-xs">{request.status}</Badge>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map(opt => <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCardClick(request)}>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};

const RequestGrid = ({ requests, onStatusChange, onCardClick, statusOptions, table }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
    const paginatedRequests = requests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [requests]);

    return (
        <>
            {requests.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {paginatedRequests.map((req) => (
                            <RequestCard
                                key={req.id}
                                request={req}
                                onStatusChange={onStatusChange}
                                onCardClick={onCardClick}
                                statusOptions={statusOptions}
                                table={table}
                            />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4 mt-4">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">Page {currentPage}/{totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-muted-foreground text-center py-10 col-span-full">Aucune demande correspondant à vos filtres.</p>
            )}
        </>
    );
};

const AdminRequestsTab = () => {
    const { toast } = useToast();
    const [serviceRequests, setServiceRequests] = useState([]);
    const [troubleshootingTickets, setTroubleshootingTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [dialogType, setDialogType] = useState('requests');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [filters, setFilters] = useState({ requests: { search: '', status: 'all' }, tickets: { search: '', status: 'all' } });
    const debouncedFilters = useDebounce(filters, 300);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [reqRes, ticketRes] = await Promise.all([
                supabase.from('service_requests').select('*, requester:requested_by_id(name), user:user_id(name, email), services:service_id(custom_banner_config)').order('created_at', { ascending: false }),
                supabase.from('troubleshooting_tickets').select('*, user:user_id(name, email, devices)').order('created_at', { ascending: false })
            ]);

            if (reqRes.error) throw reqRes.error;
            if (ticketRes.error) throw ticketRes.error;

            setServiceRequests(reqRes.data.map(r => ({ ...r, user_name: r.user?.name || r.user_name, user_email: r.user?.email || r.user_email })) || []);
            
            const enrichedTickets = ticketRes.data.map(ticket => {
                const userDevices = ticket.user?.devices || [];
                const matchingDevice = userDevices.find(d => d.name === ticket.device);
                return {
                    ...ticket,
                    user_name: ticket.user?.name,
                    user_email: ticket.user?.email,
                    device: matchingDevice || { name: ticket.device } 
                };
            });
            setTroubleshootingTickets(enrichedTickets || []);

        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les demandes." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('admin-requests-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'troubleshooting_tickets' }, fetchData)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchData]);

    const handleFilterChange = (tab, key, value) => {
        setFilters(prev => ({ ...prev, [tab]: { ...prev[tab], [key]: value } }));
    };

    const filteredData = useMemo(() => {
        const filterData = (data, filter) => {
            return data.filter(item => {
                const searchMatch = filter.search.toLowerCase() === '' || 
                                    item.user_name?.toLowerCase().includes(filter.search.toLowerCase()) ||
                                    item.user_email?.toLowerCase().includes(filter.search.toLowerCase());
                const statusMatch = filter.status === 'all' || item.status === filter.status;
                return searchMatch && statusMatch;
            });
        };

        return {
            requests: filterData(serviceRequests, debouncedFilters.requests),
            tickets: filterData(troubleshootingTickets, debouncedFilters.tickets),
        };
    }, [serviceRequests, troubleshootingTickets, debouncedFilters]);

    const handleStatusChange = async (id, newStatus, table) => {
        const { error } = await supabase.from(table).update({ status: newStatus }).eq('id', id);
        if (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le statut." });
        } else {
            toast({ title: "Succès", description: "Statut mis à jour." });
            fetchData();
        }
    };

    const handleStepChange = async (id, newStep) => {
        const { error } = await supabase.from('service_requests').update({ current_banner_step: newStep }).eq('id', id);
        if (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour l'étape." });
        } else {
            toast({ title: "Succès", description: "Étape de suivi mise à jour." });
            fetchData();
        }
    };

    const handleCardClick = (request, type) => {
        setSelectedRequest(request);
        setDialogType(type);
        setIsDialogOpen(true);
    };

    const renderFilters = (tab, statusOptions) => (
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher..."
                    className="pl-10"
                    value={filters[tab].search}
                    onChange={(e) => handleFilterChange(tab, 'search', e.target.value)}
                />
            </div>
            <Select value={filters[tab].status} onValueChange={(value) => handleFilterChange(tab, 'status', value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {statusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );

    if (loading) return <div className="flex justify-center items-center h-64"><Loader /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Tabs defaultValue="requests" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="requests">
                        <FileText className="w-4 h-4 mr-2"/>
                        Demandes de Service ({filteredData.requests.length})
                    </TabsTrigger>
                    <TabsTrigger value="tickets">
                        <Wrench className="w-4 h-4 mr-2"/>
                        Tickets de Dépannage ({filteredData.tickets.length})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="requests" className="mt-6">
                    {renderFilters('requests', ['Nouvelle', 'En cours', 'Validée', 'Annulée'])}
                    <RequestGrid
                        requests={filteredData.requests}
                        onStatusChange={handleStatusChange}
                        onCardClick={(req) => handleCardClick(req, 'requests')}
                        statusOptions={['Nouvelle', 'En cours', 'Validée', 'Annulée']}
                        table="service_requests"
                    />
                </TabsContent>
                <TabsContent value="tickets" className="mt-6">
                    {renderFilters('tickets', ['Nouveau', 'En cours', 'Résolu', 'Fermé'])}
                    <RequestGrid
                        requests={filteredData.tickets}
                        onStatusChange={handleStatusChange}
                        onCardClick={(req) => handleCardClick(req, 'tickets')}
                        statusOptions={['Nouveau', 'En cours', 'Résolu', 'Fermé']}
                        table="troubleshooting_tickets"
                    />
                </TabsContent>
            </Tabs>

            <RequestDetailsDialog
                request={selectedRequest}
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                type={dialogType}
                onStatusChange={handleStatusChange}
                onStepChange={handleStepChange}
            />
        </motion.div>
    );
};

export default AdminRequestsTab;