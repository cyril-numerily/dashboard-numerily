
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isValid, add, sub, addMonths, subMonths, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, PlusCircle, Calendar as CalendarIcon, PieChart, Trash2, MoreHorizontal, FileText, CheckCircle, Clock, Repeat, Search, Coins, Settings, ChevronLeft, ChevronRight, Target, Star, Edit, Check, Lightbulb, PiggyBank, Download, TrendingUp, TrendingDown, Copy } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Loader from '@/components/Loader';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";


const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value != null ? value : 0);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d', '#4dff4d', '#4d4dff'];

const AddFundsForm = ({ budget, onFundsAdded }) => {
    const { toast } = useToast(); const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); const [isOpen, setIsOpen] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const newTotal = budget.total_amount + parseFloat(amount);
            const { error } = await supabase.from('budgets').update({ total_amount: newTotal }).eq('id', budget.id);
            if (error) throw error; toast({ title: 'Succès', description: 'Fonds ajoutés au budget.' });
            onFundsAdded(); setIsOpen(false); setAmount('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'ajouter les fonds." });
        } finally { setIsSubmitting(false); }
    };
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm" disabled={!budget}><Coins className="mr-2 h-4 w-4" />Ajouter</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Ajouter des fonds à "{budget?.name}"</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input type="number" placeholder="Montant à ajouter" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Ajouter'}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const AddExpenseForm = ({ budget, categories, onExpenseAdded }) => {
    const { toast } = useToast();
    const [description, setDescription] = useState(''); const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState(''); const [expenseDate, setExpenseDate] = useState(new Date());
    const [isRecurring, setIsRecurring] = useState(false); const [recurringFrequency, setRecurringFrequency] = useState('monthly');
    const [recurringEndDate, setRecurringEndDate] = useState(null); const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const expensesToInsert = [];
            const commonData = { budget_id: budget.id, category_id: categoryId || null, description, amount: parseFloat(amount), status: 'pending' };
            if (isRecurring) {
                let currentDate = new Date(expenseDate);
                const finalEndDate = recurringEndDate && new Date(recurringEndDate) < new Date(budget.end_date) ? new Date(recurringEndDate) : new Date(budget.end_date);
                let recurrenceCount = 0;
                while (currentDate <= finalEndDate) {
                    recurrenceCount++;
                    if (recurrenceCount > 365) { throw new Error("Trop d'occurrences. Limité à 365 répétitions."); }
                    expensesToInsert.push({ ...commonData, expense_date: new Date(currentDate), is_recurring: true, notes: `Occurrence de "${description}"` });
                    switch (recurringFrequency) {
                        case 'daily': currentDate = add(currentDate, { days: 1 }); break;
                        case 'weekly': currentDate = add(currentDate, { weeks: 1 }); break;
                        case 'monthly': currentDate = add(currentDate, { months: 1 }); break;
                        case 'yearly': currentDate = add(currentDate, { years: 1 }); break;
                        default: throw new Error("Invalid frequency");
                    }
                }
                toast({ title: 'Succès', description: `${expensesToInsert.length} dépenses récurrentes ajoutées.` });
            } else {
                expensesToInsert.push({ ...commonData, expense_date: expenseDate, is_recurring: false });
                toast({ title: 'Succès', description: 'Dépense ajoutée.' });
            }
            if (expensesToInsert.length > 0) { const { error } = await supabase.from('expenses').insert(expensesToInsert); if (error) throw error;
            } else if (isRecurring) { toast({ variant: 'destructive', title: 'Attention', description: "Aucune dépense récurrente créée. Vérifiez les dates." }); }
            onExpenseAdded(); setIsOpen(false); setDescription(''); setAmount(''); setCategoryId(''); setIsRecurring(false);
        } catch (error) { toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'ajouter la dépense. " + error.message });
        } finally { setIsSubmitting(false); }
    };
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button size="sm" disabled={!budget?.id}><PlusCircle className="mr-2 h-4 w-4" />Dépense</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Ajouter une dépense</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
                    <Input type="number" placeholder="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    <Select onValueChange={setCategoryId} value={categoryId}><SelectTrigger><SelectValue placeholder="Catégorie (optionnel)" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                    <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{expenseDate ? format(expenseDate, 'PPP', { locale: fr }) : <span>Date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expenseDate} onSelect={setExpenseDate} initialFocus /></PopoverContent></Popover>
                    <div className="flex items-center space-x-2"><Checkbox id="isRecurring" checked={isRecurring} onCheckedChange={setIsRecurring} /><Label htmlFor="isRecurring">Dépense récurrente</Label></div>
                    {isRecurring && (<div className="space-y-4 p-4 border rounded-lg">
                            <Select onValueChange={setRecurringFrequency} value={recurringFrequency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Journalière</SelectItem><SelectItem value="weekly">Hebdomadaire</SelectItem><SelectItem value="monthly">Mensuelle</SelectItem><SelectItem value="yearly">Annuelle</SelectItem></SelectContent></Select>
                            <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{recurringEndDate ? format(recurringEndDate, 'PPP', { locale: fr }) : <span>Date de fin</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={recurringEndDate} onSelect={setRecurringEndDate} /></PopoverContent></Popover>
                            <p className="text-xs text-muted-foreground">S'arrête à la date de fin du budget si non spécifié.</p>
                        </div>)}
                    <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Ajouter'}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const AddToSavingsForm = ({ budget, globalSavings, onDataChange }) => {
    const { toast } = useToast();
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const remainingBudget = budget.total_amount - budget.expenses.reduce((sum, e) => sum + e.amount, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const savingsAmount = parseFloat(amount);
        if (savingsAmount > remainingBudget) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Le montant à épargner ne peut pas dépasser le solde restant du budget." });
            return;
        }
        setIsSubmitting(true);
        try {
            // Add an expense to represent the savings
            const { error: expenseError } = await supabase.from('expenses').insert([{
                budget_id: budget.id,
                description: `Mise de côté pour épargne`,
                amount: savingsAmount,
                expense_date: new Date(),
                status: 'paid', // Savings are immediately 'paid' out of the budget
                is_recurring: false,
                notes: `Transfert vers l'épargne globale.`
            }]);
            if (expenseError) throw expenseError;
            
            // Update global savings
            const newSavingsTotal = globalSavings + savingsAmount;
            const { error: savingsError } = await supabase.from('app_settings').update({ value: { balance: newSavingsTotal } }).eq('key', 'global_savings');
            if (savingsError) throw savingsError;
            
            toast({ title: 'Succès', description: `${formatCurrency(savingsAmount)} mis de côté dans l'épargne.` });
            onDataChange();
            setIsOpen(false);
            setAmount('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de mettre de l'argent de côté. " + error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm" disabled={!budget}><PiggyBank className="mr-2 h-4 w-4" />Épargner</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Mettre de côté pour l'épargne</DialogTitle></DialogHeader>
                <CardDescription>Transférez une partie du solde de ce budget vers votre épargne globale.</CardDescription>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <Input type="number" placeholder="Montant à épargner" value={amount} onChange={(e) => setAmount(e.target.value)} required max={remainingBudget}/>
                    <p className="text-sm text-muted-foreground">Solde restant du budget : {formatCurrency(remainingBudget)}</p>
                    <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Mettre de côté'}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const AddCategoryForm = ({ onCategoryAdded }) => {
    const { toast } = useToast(); const [name, setName] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault(); if(!name.trim()) return; setIsSubmitting(true);
        try {
            const { error } = await supabase.from('budget_categories').insert([{ name }]); if (error) throw error;
            toast({ title: 'Succès', description: 'Catégorie ajoutée.' }); onCategoryAdded(); setName('');
        } catch (error) { toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'ajouter la catégorie.' });
        } finally { setIsSubmitting(false); }
    };
    return (
        <form onSubmit={handleSubmit} className="flex gap-2 p-2">
            <Input placeholder="Nouvelle catégorie" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" size="icon" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <PlusCircle className="h-4 w-4"/>}</Button>
        </form>
    );
};

const ExpenseDetailsDialog = ({ expense, categories, onDataChange, children }) => {
    const { toast } = useToast(); const [isOpen, setIsOpen] = useState(false); const [payments, setPayments] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState(''); const [paymentDate, setPaymentDate] = useState(new Date());
    const [paymentNotes, setPaymentNotes] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false);
    const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
    const remainingAmount = expense.amount - totalPaid;
    const fetchPayments = useCallback(async () => {
        if (!isOpen) return;
        const { data, error } = await supabase.from('expense_payments').select('*').eq('expense_id', expense.id).order('payment_date', { ascending: false });
        if(error) toast({variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les paiements.'}); else setPayments(data);
    }, [expense.id, isOpen, toast]);
    useEffect(() => { fetchPayments(); }, [fetchPayments]);
    const handleAddPayment = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const { error } = await supabase.from('expense_payments').insert([{ expense_id: expense.id, amount: parseFloat(paymentAmount), payment_date: paymentDate, notes: paymentNotes }]);
            if (error) throw error; toast({ title: 'Succès', description: 'Paiement ajouté.' });
            if (remainingAmount - parseFloat(paymentAmount) <= 0) { await supabase.from('expenses').update({ status: 'paid' }).eq('id', expense.id); }
            onDataChange(); fetchPayments(); setPaymentAmount(''); setPaymentNotes('');
        } catch (error) { toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'ajouter le paiement.' });
        } finally { setIsSubmitting(false); }
    };
    const handleStatusChange = async (newStatus) => {
        try {
            const { error } = await supabase.from('expenses').update({ status: newStatus }).eq('id', expense.id);
            if (error) throw error; toast({ title: 'Succès', description: 'Statut mis à jour.' }); onDataChange();
        } catch (error) { toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.' }); }
    };
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader><DialogTitle>Détails : {expense.description}</DialogTitle><CardDescription>{categories.find(c => c.id === expense.category_id)?.name || 'Sans catégorie'}</CardDescription></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                        <Card><CardHeader><CardTitle>Résumé</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between"><span>Montant:</span><span className="font-bold">{formatCurrency(expense.amount)}</span></div>
                                <div className="flex justify-between"><span>Payé:</span><span className="font-bold text-green-500">{formatCurrency(totalPaid)}</span></div>
                                <div className="flex justify-between"><span>Restant:</span><span className="font-bold text-red-500">{formatCurrency(remainingAmount)}</span></div>
                                <div className="flex justify-between items-center">
                                    <span>Statut:</span>
                                    <Select value={expense.status} onValueChange={handleStatusChange}>
                                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="pending">En attente</SelectItem><SelectItem value="paid">Payé</SelectItem><SelectItem value="cancelled">Annulé</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                         <Card className="mt-4"><CardHeader><CardTitle>Paiements</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="space-y-2 max-h-40 overflow-y-auto">
                                    {payments.map(p => <li key={p.id} className="text-sm flex justify-between"><span>{format(new Date(p.payment_date), 'dd/MM/yy')}:</span> <span>{formatCurrency(p.amount)}</span></li>)}
                                    {payments.length === 0 && <p className="text-muted-foreground text-sm text-center">Aucun paiement.</p>}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                       <Card><CardHeader><CardTitle>Ajouter un paiement</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddPayment} className="space-y-4">
                                    <Input type="number" placeholder="Montant" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required max={remainingAmount} />
                                    <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{paymentDate ? format(paymentDate, 'PPP', { locale: fr }) : <span>Date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} initialFocus /></PopoverContent></Popover>
                                    <Textarea placeholder="Notes" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} />
                                    <Button type="submit" disabled={isSubmitting || remainingAmount <= 0} className="w-full">{isSubmitting ? <Loader2 className="animate-spin" /> : 'Ajouter'}</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const BudgetPlanner = ({ budget, categories, expenses, goals, onGoalChange }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [categoryGoals, setCategoryGoals] = useState({});

    useEffect(() => {
        const existingGoal = goals.find(g => g.type === 'category_allocation_plan');
        const initialGoals = existingGoal ? existingGoal.details.allocations || {} : {};
        const fullGoals = {};
        categories.forEach(cat => {
            fullGoals[cat.id] = initialGoals[cat.id] || 0;
        });
        setCategoryGoals(fullGoals);
    }, [goals, categories, isOpen]);

    const handleGoalChange = (categoryId, value) => {
        const parsedValue = value === '' ? 0 : parseInt(value, 10);
        if (!isNaN(parsedValue)) {
            setCategoryGoals(prev => ({ ...prev, [categoryId]: parsedValue }));
        }
    };

    const totalPercentage = useMemo(() => {
        return Object.values(categoryGoals).reduce((sum, val) => sum + (Number(val) || 0), 0);
    }, [categoryGoals]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (totalPercentage > 100) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Le total ne peut pas dépasser 100%.' });
            return;
        }
        try {
            const existingGoal = goals.find(g => g.type === 'category_allocation_plan');
            // Filter out goals with 0%
            const filteredGoals = Object.fromEntries(
                Object.entries(categoryGoals).filter(([_, value]) => value > 0)
            );

            const goalData = { budget_id: budget.id, type: 'category_allocation_plan', details: { allocations: filteredGoals } };
            
            if (existingGoal) {
                const { error } = await supabase.from('budget_goals').update(goalData).eq('id', existingGoal.id);
                if (error) throw error;
            } else if (Object.keys(filteredGoals).length > 0) {
                 const { error } = await supabase.from('budget_goals').insert([goalData]);
                 if (error) throw error;
            } else if (existingGoal) {
                // if all goals are 0, delete the plan
                const { error } = await supabase.from('budget_goals').delete().eq('id', existingGoal.id);
                if (error) throw error;
            }

            toast({ title: 'Succès', description: 'Planificateur mis à jour.' });
            onGoalChange();
            setIsOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de sauvegarder." });
        }
    };

    const categorySpending = useMemo(() => {
        const spending = {};
        categories.forEach(cat => {
            spending[cat.id] = expenses.filter(e => e.category_id === cat.id).reduce((sum, e) => sum + e.amount, 0);
        });
        return spending;
    }, [expenses, categories]);

    const adviceData = useMemo(() => {
        const plan = goals.find(g => g.type === 'category_allocation_plan')?.details.allocations;
        if (!plan) return [];
        const overspent = Object.keys(plan).filter(catId => {
            const targetAmount = (plan[catId] / 100) * budget.total_amount;
            return categorySpending[catId] > targetAmount;
        });
        return overspent.length > 0 ? [`Vous avez dépassé le budget pour : ${overspent.map(id => categories.find(c => c.id === id)?.name).join(', ')}. Envisagez de réduire les dépenses.`] : ["Excellent travail ! Toutes les catégories sont dans les limites."];
    }, [goals, budget.total_amount, categorySpending, categories]);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2"><Target />Planificateur</CardTitle>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild><Button size="sm" variant="outline"><Edit className="mr-2 h-4 w-4" />Ajuster</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Ajuster le Plan de Répartition</DialogTitle></DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4 my-4 max-h-96 overflow-y-auto pr-2">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="flex items-center gap-4">
                                            <Label htmlFor={`goal-${cat.id}`} className="flex-1">{cat.name}</Label>
                                            <div className="flex items-center gap-2 w-40">
                                                <Input type="number" id={`goal-${cat.id}`} min="0" max="100" value={categoryGoals[cat.id] || ''} onChange={e => handleGoalChange(cat.id, e.target.value)} className="w-24" />
                                                <span>%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={`font-bold text-right mb-4 ${totalPercentage > 100 ? 'text-red-500' : ''}`}>Total: {totalPercentage}% / 100%</div>
                                <DialogFooter><Button type="submit">Sauvegarder</Button></DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.keys(categoryGoals).length > 0 ? categories.filter(c => categoryGoals[c.id] > 0).map(cat => {
                    const targetPercent = categoryGoals[cat.id];
                    const targetAmount = (targetPercent / 100) * budget.total_amount;
                    const spentAmount = categorySpending[cat.id] || 0;
                    const progress = targetAmount > 0 ? (spentAmount / targetAmount) * 100 : 0;
                    return (
                        <div key={cat.id} className="space-y-1">
                            <div className="flex justify-between text-sm"><span className="font-medium">{cat.name} ({targetPercent}%)</span><span>{formatCurrency(spentAmount)} / <span className="text-muted-foreground">{formatCurrency(targetAmount)}</span></span></div>
                            <Progress value={progress > 100 ? 100 : progress} indicatorClassName={progress > 100 ? 'bg-red-500' : 'bg-primary'} />
                        </div>
                    );
                }) : <p className="text-muted-foreground text-center py-4">Aucun plan de répartition défini.</p>}
                {adviceData.length > 0 && (<Card className="bg-secondary/50 mt-4"><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="text-yellow-400" />Conseils</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside text-sm text-muted-foreground">{adviceData.map((item, i) => <li key={i}>{item}</li>)}</ul></CardContent></Card>)}
            </CardContent>
        </Card>
    );
};

const BudgetDetails = ({ budget, categories, expenses, goals, globalSavings, onDataChange }) => {
    const { toast } = useToast(); const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); const [categoryFilter, setCategoryFilter] = useState('all');
    const debouncedSearchTerm = useDebounce(searchTerm, 300); const [timeRange, setTimeRange] = useState('month');
    const [date, setDate] = useState(new Date());

    const { startDate, endDate, isNextDisabled, isPrevDisabled } = useMemo(() => {
        if (!budget) return { startDate: null, endDate: null, isNextDisabled: true, isPrevDisabled: true };
        const budgetStart = new Date(budget.start_date); const budgetEnd = new Date(budget.end_date);
        switch (timeRange) {
            case 'month':
                const currentStartDate = startOfMonth(date); const currentEndDate = endOfMonth(date);
                return { startDate: currentStartDate, endDate: currentEndDate, isNextDisabled: isAfter(startOfMonth(addMonths(date, 1)), budgetEnd), isPrevDisabled: isAfter(budgetStart, endOfMonth(subMonths(date, 1))) };
            default: return { startDate: budgetStart, endDate: budgetEnd, isNextDisabled: true, isPrevDisabled: true };
        }
    }, [budget, timeRange, date]);

    const filteredExpenses = useMemo(() => {
        if (!startDate || !endDate) return [];
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.expense_date);
            return isValid(expenseDate) && expenseDate >= startDate && expenseDate <= endDate &&
                   (debouncedSearchTerm ? expense.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) : true) &&
                   (statusFilter !== 'all' ? expense.status === statusFilter : true) &&
                   (categoryFilter !== 'all' ? expense.category_id === categoryFilter : true);
        });
    }, [expenses, startDate, endDate, debouncedSearchTerm, statusFilter, categoryFilter]);

    const totalSpentOverall = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
    const remaining = budget.total_amount - totalSpentOverall;
    const progress = budget.total_amount > 0 ? (totalSpentOverall / budget.total_amount) * 100 : 0;
    
    const costControl = useMemo(() => {
        const usage = progress;
        if (usage > 100) return { text: 'Dépassement', icon: <TrendingDown className="text-red-500" />, color: "text-red-500" };
        if (usage >= 85) return { text: 'Excellent', icon: <TrendingUp className="text-green-500" />, color: "text-green-500" };
        if (usage >= 50) return { text: 'Bon', icon: <TrendingUp className="text-yellow-500" />, color: "text-yellow-500" };
        return { text: 'Sous-investissement', icon: <TrendingDown className="text-orange-500" />, color: "text-orange-500" };
    }, [progress]);

    const { chartData } = useMemo(() => {
        return { chartData: categories.map(category => ({
            name: category.name,
            value: expenses.filter(e => e.category_id === category.id).reduce((sum, e) => sum + e.amount, 0)
        })).filter(d => d.value > 0) };
    }, [categories, expenses]);
    
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent * 100 < 5) return null;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">{`${(percent * 100).toFixed(0)}%`}</text>;
    };

    const handleDeleteExpense = async (expenseId) => {
        try {
            await supabase.from('expense_payments').delete().eq('expense_id', expenseId);
            const { error } = await supabase.from('expenses').delete().eq('id', expenseId); if (error) throw error;
            toast({ title: 'Succès', description: 'Dépense supprimée.' }); onDataChange();
        } catch (error) { toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de supprimer la dépense." }); }
    }

    const StatusIcon = ({ status }) => {
        if (status === 'paid') return <CheckCircle className="h-4 w-4 text-green-500" />;
        if (status === 'pending') return <Clock className="h-4 w-4 text-yellow-500" />;
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    };
    
    return (
        <Card className="mt-4 bg-secondary/20 border-border/50">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl flex items-center gap-2">{budget.name} {budget.is_default && <Star className="h-5 w-5 text-yellow-400 fill-current" />}</CardTitle>
                        <CardDescription>Du {format(new Date(budget.start_date), 'dd/MM/yyyy')} au {format(new Date(budget.end_date), 'dd/MM/yyyy')}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <AddToSavingsForm budget={{...budget, expenses}} globalSavings={globalSavings} onDataChange={onDataChange} />
                        <AddFundsForm budget={budget} onFundsAdded={onDataChange} />
                        <AddExpenseForm budget={budget} categories={categories} onExpenseAdded={onDataChange} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Dépensé</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalSpentOverall)}</p></CardContent></Card>
                    <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Solde Restant</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(remaining)}</p></CardContent></Card>
                    <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Budget Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(budget.total_amount)}</p></CardContent></Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Maîtrise des Coûts</CardTitle></CardHeader>
                        <CardContent><p className={`text-2xl font-bold flex items-center gap-2 ${costControl.color}`}>{costControl.icon} {costControl.text}</p></CardContent>
                    </Card>
                </div>
                <div>
                     <Progress value={progress} className="h-3" indicatorClassName={progress > 100 ? "bg-red-500" : "bg-gradient-to-r from-cyan-400 to-blue-500"} />
                    <p className="text-right text-sm text-muted-foreground mt-1">{progress.toFixed(2)}% du budget utilisé</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <BudgetPlanner budget={budget} categories={categories} expenses={expenses} goals={goals} onGoalChange={onDataChange} />
                    <Card>
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><PieChart/>Répartition (Total)</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPieChart>
                                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={renderCustomizedLabel}>
                                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader>
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <CardTitle className="text-lg">Dépenses</CardTitle>
                            <div className="flex items-center gap-2">
                                <Select value={timeRange} onValueChange={setTimeRange}>
                                    <SelectTrigger className="w-auto md:w-[180px]"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="month">Mois</SelectItem><SelectItem value="all">Durée du budget</SelectItem></SelectContent>
                                </Select>
                                {timeRange !== 'all' && (
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" onClick={() => setDate(subMonths(date, 1))} disabled={isPrevDisabled}><ChevronLeft className="h-4 w-4" /></Button>
                                    <span className="text-sm font-medium w-32 text-center capitalize">{format(date, 'MMMM yyyy', { locale: fr })}</span>
                                    <Button variant="outline" size="icon" onClick={() => setDate(addMonths(date, 1))} disabled={isNextDisabled}><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 mt-4">
                            <div className="relative w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" /></div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full md:w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem><SelectItem value="pending">En attente</SelectItem><SelectItem value="paid">Payé</SelectItem><SelectItem value="cancelled">Annulé</SelectItem></SelectContent></Select>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-full md:w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes catégories</SelectItem>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {filteredExpenses.sort((a,b) => new Date(b.expense_date) - new Date(a.expense_date)).map(expense => (
                                <li key={expense.id} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-secondary/50">
                                    <div className="flex items-center gap-3">
                                        <StatusIcon status={expense.status} />
                                        <div>
                                            <p className="font-medium flex items-center gap-2">{expense.description || 'Dépense'} {expense.is_recurring && <Repeat className="h-3 w-3 text-muted-foreground" />}</p>
                                            <p className="text-xs text-muted-foreground">{categories.find(c => c.id === expense.category_id)?.name || 'Sans catégorie'} - {format(new Date(expense.expense_date), 'dd/MM/yy')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                                        <ExpenseDetailsDialog expense={expense} categories={categories} onDataChange={onDataChange}><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></ExpenseDetailsDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive"/></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle><AlertDialogDescription>Action irréversible.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </li>
                            ))}
                            {filteredExpenses.length === 0 && <p className="text-muted-foreground text-center py-10">Aucune dépense pour cette période.</p>}
                        </ul>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
};

const CreateBudgetForm = ({ onBudgetCreated }) => {
    const { toast } = useToast(); const [name, setName] = useState(''); const [totalAmount, setTotalAmount] = useState('');
    const [startDate, setStartDate] = useState(new Date()); const [endDate, setEndDate] = useState(endOfYear(new Date()));
    const [isSubmitting, setIsSubmitting] = useState(false); const [isOpen, setIsOpen] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const { data, error } = await supabase.from('budgets').insert([{ name, total_amount: parseFloat(totalAmount), start_date: startDate, end_date: endDate, }]).select().single();
            if (error) throw error; toast({ title: 'Succès', description: 'Nouveau budget créé.' }); onBudgetCreated(data.id);
            setIsOpen(false); setName(''); setTotalAmount('');
        } catch (error) { toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de créer le budget. ' + error.message });
        } finally { setIsSubmitting(false); }
    };
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()}><PlusCircle className="mr-2 h-4 w-4" /><span>Créer un budget</span></DropdownMenuItem></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Créer un nouveau budget</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input placeholder="Nom du budget" value={name} onChange={e => setName(e.target.value)} required />
                    <Input type="number" placeholder="Montant total" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} required />
                    <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{startDate ? format(startDate, 'PPP', { locale: fr }) : <span>Début</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent></Popover>
                    <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{endDate ? format(endDate, 'PPP', { locale: fr }) : <span>Fin</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent></Popover>
                    <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Créer'}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const GenerateReportDialog = ({ budget, expenses, categories, goals, globalSavings }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const reportText = useMemo(() => {
        if (!budget) return "";
        let text = `RÉCAPITULATIF DU BUDGET : ${budget.name}\n`;
        text += `Période : Du ${format(new Date(budget.start_date), 'dd/MM/yyyy')} au ${format(new Date(budget.end_date), 'dd/MM/yyyy')}\n`;
        text += `==================================================\n\n`;
        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const remaining = budget.total_amount - totalSpent;
        const progress = budget.total_amount > 0 ? (totalSpent / budget.total_amount) * 100 : 0;
        text += `ÉTAT GÉNÉRAL\n`;
        text += `Budget Total : ${formatCurrency(budget.total_amount)}\n`;
        text += `Total Dépensé : ${formatCurrency(totalSpent)} (${progress.toFixed(2)}%)\n`;
        text += `Solde Restant : ${formatCurrency(remaining)}\n`;
        const savedDuringBudget = expenses.filter(e => e.description === "Mise de côté pour épargne").reduce((sum, e) => sum + e.amount, 0);
        text += `Montant Mis de Côté : ${formatCurrency(savedDuringBudget)}\n`;
        text += `\n`;
        text += `ÉPARGNE GLOBALE\n`;
        text += `Solde Total : ${formatCurrency(globalSavings)}\n`;
        text += `\n`;
        text += `RÉPARTITION PAR CATÉGORIE\n`;
        categories.forEach(cat => {
            const catExpenses = expenses.filter(e => e.category_id === cat.id);
            if (catExpenses.length > 0) {
                const catTotal = catExpenses.reduce((sum, e) => sum + e.amount, 0);
                const catProgress = totalSpent > 0 ? (catTotal / totalSpent) * 100 : 0;
                text += `- ${cat.name} : ${formatCurrency(catTotal)} (${catProgress.toFixed(2)}% des dépenses)\n`;
            }
        });
        text += `\n`;
        text += `OBJECTIFS\n`;
        const plan = goals.find(g => g.type === 'category_allocation_plan')?.details.allocations;
        if (plan) {
            text += `Plan de répartition :\n`;
            Object.keys(plan).forEach(catId => {
                const cat = categories.find(c => c.id === catId);
                if (cat) {
                    const targetPercent = plan[catId];
                    const targetAmount = (targetPercent / 100) * budget.total_amount;
                    const spentAmount = expenses.filter(e => e.category_id === catId).reduce((sum, e) => sum + e.amount, 0);
                    const status = spentAmount <= targetAmount ? "OK" : "DÉPASSÉ";
                    text += `- ${cat.name} : ${formatCurrency(spentAmount)} / ${formatCurrency(targetAmount)} (${targetPercent}%) - Statut : ${status}\n`;
                }
            });
        } else {
            text += `Aucun plan de répartition défini.\n`;
        }
        return text;
    }, [budget, expenses, categories, goals, globalSavings]);

    const handleCopy = () => {
        navigator.clipboard.writeText(reportText);
        toast({ title: 'Copié !', description: 'Le rapport a été copié dans le presse-papiers.' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm" disabled={!budget}><Download className="mr-2 h-4 w-4" />Rapport</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Rapport du Budget : {budget?.name}</DialogTitle></DialogHeader>
                <Textarea value={reportText} readOnly className="h-96 text-xs font-mono" />
                <DialogFooter>
                    <Button onClick={handleCopy}><Copy className="mr-2 h-4 w-4" />Copier le rapport</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const AdminBudgetTab = () => {
    const { toast } = useToast(); const [loading, setLoading] = useState(true);
    const [budgets, setBudgets] = useState([]); const [selectedBudgetId, setSelectedBudgetId] = useState(null);
    const [categories, setCategories] = useState([]); const [expenses, setExpenses] = useState([]);
    const [goals, setGoals] = useState([]); const [globalSavings, setGlobalSavings] = useState(0);
    
    const selectedBudget = useMemo(() => budgets.find(b => b.id === selectedBudgetId), [budgets, selectedBudgetId]);

    const fetchData = useCallback(async (budgetIdToLoad = null) => {
        setLoading(true);
        try {
            const { data: budgetsData, error: budgetsError } = await supabase.from('budgets').select('*').order('created_at', { ascending: false });
            if (budgetsError) throw budgetsError;
            setBudgets(budgetsData);

            let finalBudgetId = budgetIdToLoad;
            if (!finalBudgetId) {
                const defaultBudget = budgetsData.find(b => b.is_default);
                finalBudgetId = defaultBudget ? defaultBudget.id : (budgetsData[0]?.id || null);
            }
            setSelectedBudgetId(finalBudgetId);
            
            const { data: savingsData, error: savingsError } = await supabase.from('app_settings').select('value').eq('key', 'global_savings').single();
            if (savingsError) console.error("Could not fetch savings, defaulting to 0.");
            setGlobalSavings(savingsData?.value?.balance || 0);

            if (finalBudgetId) {
                await fetchDetailsForBudget(finalBudgetId);
            } else {
                setCategories([]); setExpenses([]); setGoals([]);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Chargement des données impossible. ' + error.message });
        } finally { setLoading(false); }
    }, [toast]);
    
    const fetchDetailsForBudget = async (budgetId) => {
        try {
            const [categoriesRes, expensesRes, goalsRes] = await Promise.all([
                supabase.from('budget_categories').select('*').order('name'),
                supabase.from('expenses').select('*').eq('budget_id', budgetId),
                supabase.from('budget_goals').select('*').eq('budget_id', budgetId)
            ]);
            if (categoriesRes.error) throw categoriesRes.error; setCategories(categoriesRes.data);
            if (expensesRes.error) throw expensesRes.error; setExpenses(expensesRes.data);
            if (goalsRes.error) throw goalsRes.error; setGoals(goalsRes.data);
        } catch(error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Rafraîchissement impossible. ' + error.message });
        }
    }

    const refreshDataForCurrentBudget = useCallback(async () => {
        if (!selectedBudgetId) return;
        setLoading(true);
        try {
             await fetchDetailsForBudget(selectedBudgetId);
             const { data: savingsData } = await supabase.from('app_settings').select('value').eq('key', 'global_savings').single();
             setGlobalSavings(savingsData?.value?.balance || 0);
        } catch(error) {
             toast({ variant: 'destructive', title: 'Erreur', description: 'Rafraîchissement impossible. ' + error.message });
        } finally { setLoading(false); }
    }, [selectedBudgetId, toast]);
    
    useEffect(() => { fetchData(); }, [fetchData]);
    
    useEffect(() => {
        if (selectedBudgetId) {
            fetchDetailsForBudget(selectedBudgetId);
        }
    }, [selectedBudgetId]);

    const handleBudgetChange = (budgetId) => { setSelectedBudgetId(budgetId); };

    const handleDeleteBudget = async (budgetIdToDelete) => {
        try {
            await supabase.from('budget_goals').delete().eq('budget_id', budgetIdToDelete);
            await supabase.from('expenses').delete().eq('budget_id', budgetIdToDelete);
            await supabase.from('budgets').delete().eq('id', budgetIdToDelete);
            toast({ title: "Succès", description: "Budget supprimé." });
            fetchData();
        } catch (error) { toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de supprimer le budget." }); }
    };
    
    const handleSetDefaultBudget = async (budgetId) => {
        try {
            await supabase.from('budgets').update({ is_default: false }).eq('is_default', true);
            const { error } = await supabase.from('budgets').update({ is_default: true }).eq('id', budgetId); if (error) throw error;
            toast({ title: 'Succès', description: 'Budget par défaut mis à jour.' });
            const updatedBudgets = budgets.map(b => ({...b, is_default: b.id === budgetId}));
            setBudgets(updatedBudgets);
        } catch (error) { toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de définir le budget par défaut." }); }
    };

    const handleDeleteCategory = async (categoryId) => {
         try {
            await supabase.from('expenses').update({ category_id: null }).eq('category_id', categoryId);
            const { error } = await supabase.from('budget_categories').delete().eq('id', categoryId); if(error) throw error;
            toast({title: "Succès", description: "Catégorie supprimée."}); refreshDataForCurrentBudget();
        } catch (error) { toast({variant: 'destructive', title: 'Erreur', description: "Impossible de supprimer la catégorie."}); }
    };
    
    if (loading && !selectedBudget) return <Loader />;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                     <Select value={selectedBudgetId || ""} onValueChange={handleBudgetChange}>
                        <SelectTrigger className="w-[250px]"><SelectValue placeholder="Sélectionner un budget" /></SelectTrigger>
                        <SelectContent>
                            {budgets.length > 0 ? budgets.map(b => (
                                <SelectItem key={b.id} value={b.id}><span className="flex items-center">{b.name} {b.is_default && <Star className="ml-2 h-4 w-4 text-yellow-500 fill-current" />}</span></SelectItem>
                            )) : <SelectItem value="" disabled>Aucun budget</SelectItem>}
                        </SelectContent>
                    </Select>
                    {selectedBudget && <GenerateReportDialog budget={selectedBudget} expenses={expenses} categories={categories} goals={goals} globalSavings={globalSavings} />}
                </div>

                 <div className="flex items-center gap-4">
                    <Card className="p-3">
                        <div className="flex items-center gap-2">
                             <PiggyBank className="h-5 w-5 text-primary" />
                             <div>
                                <p className="text-xs text-muted-foreground">Épargne Globale</p>
                                <p className="font-bold text-base">{formatCurrency(globalSavings)}</p>
                             </div>
                        </div>
                    </Card>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                             <CreateBudgetForm onBudgetCreated={(newId) => fetchData(newId)} />
                             <DropdownMenuSub>
                                <DropdownMenuSubTrigger><Star className="mr-2 h-4 w-4" />Définir par défaut</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>{budgets.map(b => <DropdownMenuItem key={b.id} onClick={() => handleSetDefaultBudget(b.id)} disabled={b.is_default}>{b.name}</DropdownMenuItem>)}</DropdownMenuSubContent>
                             </DropdownMenuSub>
                             <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer un budget</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    {budgets.map(b => (
                                        <AlertDialog key={b.id}><AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">{b.name}</DropdownMenuItem></AlertDialogTrigger>
                                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer "{b.name}"?</AlertDialogTitle><AlertDialogDescription>Action irréversible.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteBudget(b.id)}>Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                        </AlertDialog>))}
                                    {budgets.length === 0 && <DropdownMenuItem disabled>Aucun budget</DropdownMenuItem>}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Gérer les catégories</DropdownMenuLabel>
                            <div className="p-2 max-h-60 overflow-y-auto">
                                {categories.map(c => (
                                    <DropdownMenuItem key={c.id} onSelect={(e) => e.preventDefault()} className="flex justify-between items-center">
                                        <span>{c.name}</span>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3 text-destructive"/></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle><AlertDialogDescription>Les dépenses deviendront 'sans catégorie'.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory(c.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuItem>))}
                            </div>
                            <AddCategoryForm onCategoryAdded={refreshDataForCurrentBudget} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            
            {loading && <div className="py-12"><Loader/></div>}
            {!loading && selectedBudget ? (
                <BudgetDetails budget={selectedBudget} categories={categories} expenses={expenses} goals={goals} globalSavings={globalSavings} onDataChange={refreshDataForCurrentBudget} />
            ) : !loading && <Card className="mt-4 flex flex-col items-center justify-center p-12 text-center">
                    <CardTitle>Bienvenue dans le Budget</CardTitle>
                    <CardDescription className="mt-2">Créez votre premier budget via le menu <Settings className="inline-block h-4 w-4 mx-1"/>.</CardDescription>
                </Card>
            }
        </div>
    );
};

export default AdminBudgetTab;
