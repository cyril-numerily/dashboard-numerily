import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    LayoutDashboard, Code, Wrench, Ticket, Bot, ShieldCheck, Monitor,
    Users, BarChart2, PieChart, MessageSquare, FileText,
    Settings, Package, Mail, Megaphone, PanelLeftClose, PanelRightClose, ShoppingCart, Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NavItem = ({ to, icon: Icon, label, disabled, isExpanded, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    const content = (
        <div
            className={cn(
                "flex items-center h-12 text-sm font-medium rounded-lg transition-colors group",
                isExpanded ? "px-4" : "w-full justify-center",
                isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
            )}
            onClick={onClick}
        >
            <div className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200",
                isActive ? "bg-primary-foreground text-primary" : "group-hover:bg-muted-foreground/20"
            )}>
                <Icon className="h-5 w-5" />
            </div>
            {isExpanded && <span className="ml-4 truncate">{label}</span>}
        </div>
    );

    if (disabled) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="w-full">{content}</div>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>{label}</p>
                    <p className="text-xs text-muted-foreground">Abonnement requis</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    if (onClick) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="w-full">{content}</div>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link to={to} className="w-full">{content}</Link>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
};

const Sidebar = ({ profile, isExpanded, setIsExpanded }) => {
    const { role, subscription, disabled_sections = [] } = profile;

    const hasSubscription = subscription !== 'none';

    const userNavItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
        { to: '/service-catalog', icon: Code, label: 'Catalogue de services', section: 'service-catalog' },
        { to: '/troubleshooting', icon: Wrench, label: 'Dépannage Gratuit', section: 'troubleshooting', disabled: !hasSubscription },
        { to: '/promocodes', icon: Ticket, label: 'Codes Promos', section: 'promocodes', disabled: !hasSubscription },
        { to: '/assistly-ia', icon: Bot, label: 'Assistly IA', section: 'assistly-ia', disabled: !hasSubscription },
        { to: '/prioritysupport', icon: ShieldCheck, label: 'Support Prioritaire', section: 'prioritysupport', disabled: !hasSubscription },
        { to: '/devices', icon: Monitor, label: 'Mes PC', section: 'devices', disabled: !hasSubscription },
    ];

    const partnerNavItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
        { to: '/partner/clients', icon: Users, label: 'Mes Clients' },
        { to: '/service-catalog', icon: ShoppingCart, label: 'Commander un service' },
        { to: '/partner/tracking', icon: BarChart2, label: 'Suivi des services' },
        { to: '/partner/commissions', icon: PieChart, label: 'Commissions' },
        { to: '/partner/contact', icon: MessageSquare, label: 'Contact Support' },
        { to: '/partner/documents', icon: FileText, label: 'Documents' },
    ];

    const adminNavItems = [
        { to: '/admin', icon: LayoutDashboard, label: 'Tableau de bord' },
        { to: '/admin/users', icon: Users, label: 'Utilisateurs' },
        { to: '/admin/services', icon: Package, label: 'Services' },
        { to: '/admin/tickets', icon: Ticket, label: 'Tickets & Demandes' },
        { to: '/admin/budget', icon: Wallet, label: 'Budget & Finances' },
        { to: '/admin/marketing', icon: Megaphone, label: 'Marketing' },
        { to: '/admin/messages', icon: Mail, label: 'Messages' },
    ];

    let navItems = [];
    if (role === 'user') {
        navItems = userNavItems.filter(item => !item.section || !disabled_sections.includes(item.section));
    } else if (role === 'partner') {
        navItems = partnerNavItems;
    } else if (role === 'admin') {
        navItems = adminNavItems;
    }

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-background sm:flex transition-all duration-300",
            isExpanded ? "w-64" : "w-20"
        )}>
            <div className="h-16"></div>
            <nav className="flex flex-col gap-2 px-2 sm:py-5 flex-1">
                {navItems.map((item) => (
                    <NavItem key={item.to} {...item} isExpanded={isExpanded} />
                ))}
            </nav>
            <nav className="flex flex-col gap-2 px-2 sm:py-5 border-t">
                <NavItem to="/settings" icon={Settings} label="Paramètres" isExpanded={isExpanded} />
                <NavItem
                    icon={isExpanded ? PanelLeftClose : PanelRightClose}
                    label={isExpanded ? "Réduire la barre latérale" : "Développer la barre latérale"}
                    isExpanded={isExpanded}
                    onClick={() => setIsExpanded(!isExpanded)}
                />
            </nav>
        </aside>
    );
};

export default Sidebar;