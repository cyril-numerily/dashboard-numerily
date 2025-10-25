import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User as UserIcon, Settings, LayoutDashboard, Wallet, HeartHandshake, Zap, ShieldCheck, Bot, FileText, PieChart, Users } from 'lucide-react';
import AuthForm from '@/components/AuthForm';
import Loader from '@/components/Loader';
import Sidebar from '@/components/Sidebar';
import PartnerPage from '@/pages/PartnerPage';
import BookServicePage from '@/pages/BookServicePage';
import ServiceCatalogPage from '@/pages/ServiceCatalogPage';
import UserDashboard from '@/pages/user/UserDashboard';
import ServiceRequestsPage from '@/pages/user/ServiceRequestsPage';
import TroubleshootingPage from '@/pages/user/TroubleshootingPage';
import DevicesPage from '@/pages/user/DevicesPage';
import SettingsPage from '@/pages/user/SettingsPage';
import PromoCodesPage from '@/pages/user/PromoCodesPage';
import PrioritySupportPage from '@/pages/user/PrioritySupportPage';
import AssistlyIAPage from '@/pages/user/AssistlyIAPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminServicesPage from '@/pages/admin/AdminServicesPage';
import AdminTicketsPage from '@/pages/admin/AdminTicketsPage';
import AdminBudgetPage from '@/pages/admin/AdminBudgetPage';
import AdminMarketingPage from '@/pages/admin/AdminMarketingPage';
import AdminMessagesPage from '@/pages/admin/AdminMessagesPage';
import PartnerClientsPage from '@/pages/partner/PartnerClientsPage';
import PartnerTrackingPage from '@/pages/partner/PartnerTrackingPage';
import PartnerCommissionsPage from '@/pages/partner/PartnerCommissionsPage';
import PartnerContactPage from '@/pages/partner/PartnerContactPage';
import PartnerDocumentsPage from '@/pages/partner/PartnerDocumentsPage';
import PartnerCalendarPage from '@/pages/partner/PartnerCalendarPage';
import NotificationDropdown from '@/components/NotificationDropdown';
import UserDetailsPage from '@/pages/admin/UserDetailsPage';
import QuickAssistGuidePage from '@/pages/user/QuickAssistGuidePage';
import { cn } from '@/lib/utils';

const FeatureCard = ({
  icon,
  title,
  description,
  delay
}) => {
  const Icon = icon;
  return <motion.div initial={{
    opacity: 0,
    y: 30
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5,
    delay
  }} className="flex items-start gap-4 p-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </motion.div>;
};
const LandingPage = ({
  onLogin,
  onSignup
}) => {
  const clientFeatures = [{
    icon: Zap,
    title: "Services à la demande",
    description: "Commandez des services de dépannage et d'assistance en quelques clics."
  }, {
    icon: ShieldCheck,
    title: "Support Prioritaire",
    description: "Accédez à une assistance dédiée pour répondre à toutes vos questions."
  }, {
    icon: Bot,
    title: "Assistant IA",
    description: "Obtenez des réponses instantanées et des solutions grâce à notre IA intelligente."
  }];
  const partnerFeatures = [{
    icon: Users,
    title: "Gestion des clients",
    description: "Suivez et gérez facilement les services et demandes de vos clients."
  }, {
    icon: PieChart,
    title: "Suivi des commissions",
    description: "Visualisez vos gains en temps réel et suivez vos performances."
  }, {
    icon: FileText,
    title: "Accès aux documents",
    description: "Retrouvez tous les documents importants et ressources utiles."
  }];
  return <div className="relative min-h-screen text-white overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 z-0">
                <img alt="Abstract elegant dark background with subtle light patterns" className="w-full h-full object-cover" src="https://horizons-cdn.hostinger.com/1dfec302-4fd6-4f8b-a330-41699fd1c70b/background-SU838.jpg" />
                <div className="absolute inset-0 bg-background/80"></div>
            </div>
            <div className="relative z-10 container mx-auto px-4 py-12 text-center max-w-4xl">
                 <motion.div initial={{
        opacity: 0,
        scale: 0.8
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        duration: 0.6,
        delay: 0.2
      }} className="mb-8">
                   <img src="https://horizons-cdn.hostinger.com/1dfec302-4fd6-4f8b-a330-41699fd1c70b/0ac431826d77a7b40d9a1d9dff18a3be.png" alt="Numerily Logo" className="h-16 mx-auto" />
                </motion.div>
                <motion.h1 initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6,
        delay: 0.4
      }} className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Votre espace Numerily
      </motion.h1>
                <motion.p initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6,
        delay: 0.6
      }} className="text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-8">Votre espace Numerily, pensé pour tous vos besoins.</motion.p>
                <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6,
        delay: 0.8
      }} className="flex items-center justify-center gap-4 mb-12">
                    <Button onClick={onLogin} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md px-6 py-3 text-lg">
                        Se connecter
                    </Button>
                    <Button onClick={onSignup} className="bg-white text-black hover:bg-gray-200 px-6 py-3 text-lg">
                        S'inscrire
                    </Button>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
                    <div className="bg-glass p-5 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <UserIcon className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-bold">Pour les Clients</h2>
                        </div>
                        <div className="space-y-1">
                            {clientFeatures.map((feature, index) => <FeatureCard key={index} {...feature} delay={1 + index * 0.2} />)}
                        </div>
                    </div>
                     <div className="bg-glass p-5 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <HeartHandshake className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-bold">Pour les Partenaires</h2>
                        </div>
                        <div className="space-y-1">
                             {partnerFeatures.map((feature, index) => <FeatureCard key={index} {...feature} delay={1.2 + index * 0.2} />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>;
};
const MainContent = () => {
  const {
    profile
  } = useAuth();
  if (!profile) {
    return <Navigate to="/" replace />;
  }
  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (profile.role === 'partner') {
    return <PartnerPage />;
  }
  if (profile.role === 'user') {
    return <UserDashboard />;
  }
  return <p className="text-center text-foreground">Rôle non défini. Veuillez contacter le support.</p>;
};
const ProtectedRoute = ({
  children,
  roles
}) => {
  const {
    user,
    profile,
    loading
  } = useAuth();
  if (loading) {
    return null;
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};
const AppContent = ({
  onLogin,
  onSignup
}) => {
  const {
    user,
    profile,
    loading
  } = useAuth();
  const location = useLocation();
  if (loading) {
    return null;
  }
  const disabledSections = profile?.disabled_sections || [];
  const userFeatures = {
    'service-catalog': {
      path: '/service-catalog',
      element: <ServiceCatalogPage />
    },
    'troubleshooting': {
      path: '/troubleshooting',
      element: <TroubleshootingPage />
    },
    'devices': {
      path: '/devices',
      element: <DevicesPage />
    },
    'promocodes': {
      path: '/promocodes',
      element: <PromoCodesPage />
    },
    'prioritysupport': {
      path: '/prioritysupport',
      element: <PrioritySupportPage />
    },
    'assistly-ia': {
      path: '/assistly-ia',
      element: <AssistlyIAPage />
    }
  };
  const visibleUserRoutes = Object.keys(userFeatures).filter(key => !disabledSections.includes(key)).map(key => <Route key={key} path={userFeatures[key].path} element={<ProtectedRoute roles={['user']}>{userFeatures[key].element}</ProtectedRoute>} />);
  return <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} transition={{
      duration: 0.3
    }} className="w-full">
                <Routes location={location}>
                    <Route path="/" element={!user ? <LandingPage onLogin={onLogin} onSignup={onSignup} /> : <Navigate to="/dashboard" />} />
                    
                    <Route path="/dashboard" element={<ProtectedRoute><MainContent /></ProtectedRoute>} />
                    
                    <Route path="/service-catalog" element={<ProtectedRoute roles={['user', 'partner']}><ServiceCatalogPage /></ProtectedRoute>} />
                    <Route path="/book-service/:serviceId" element={<ProtectedRoute roles={['user', 'partner']}><BookServicePage /></ProtectedRoute>} />
                    <Route path="/service-requests" element={<ProtectedRoute roles={['user']}><ServiceRequestsPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/prepare-troubleshooting" element={<ProtectedRoute roles={['user']}><QuickAssistGuidePage /></ProtectedRoute>} />
                    
                    {visibleUserRoutes}

                    {/* Partner Routes */}
                    <Route path="/partner/clients" element={<ProtectedRoute roles={['partner']}><PartnerClientsPage /></ProtectedRoute>} />
                    <Route path="/partner/tracking" element={<ProtectedRoute roles={['partner']}><PartnerTrackingPage /></ProtectedRoute>} />
                    <Route path="/partner/commissions" element={<ProtectedRoute roles={['partner']}><PartnerCommissionsPage /></ProtectedRoute>} />
                    <Route path="/partner/contact" element={<ProtectedRoute roles={['partner']}><PartnerContactPage /></ProtectedRoute>} />
                    <Route path="/partner/documents" element={<ProtectedRoute roles={['partner']}><PartnerDocumentsPage /></ProtectedRoute>} />
                    <Route path="/partner/calendar" element={<ProtectedRoute roles={['partner']}><PartnerCalendarPage /></ProtectedRoute>} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
                    <Route path="/admin/users/:userId" element={<ProtectedRoute roles={['admin']}><UserDetailsPage /></ProtectedRoute>} />
                    <Route path="/admin/services" element={<ProtectedRoute roles={['admin']}><AdminServicesPage /></ProtectedRoute>} />
                    <Route path="/admin/tickets" element={<ProtectedRoute roles={['admin']}><AdminTicketsPage /></ProtectedRoute>} />
                    <Route path="/admin/budget" element={<ProtectedRoute roles={['admin']}><AdminBudgetPage /></ProtectedRoute>} />
                    <Route path="/admin/marketing" element={<ProtectedRoute roles={['admin']}><AdminMarketingPage /></ProtectedRoute>} />
                    <Route path="/admin/messages" element={<ProtectedRoute roles={['admin']}><AdminMessagesPage /></ProtectedRoute>} />
                    <Route path="/admin/commissions" element={<Navigate to="/admin/budget" />} />


                    <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
                </Routes>
            </motion.div>
        </AnimatePresence>;
};
function App() {
  const {
    user,
    profile,
    signOut,
    loading
  } = useAuth();
  const [authMode, setAuthMode] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const {
    toast
  } = useToast();
  const handleSignOut = async () => {
    await signOut();
    toast({
      title: '✅ Déconnexion réussie !',
      description: 'À bientôt !'
    });
  };
  const handleWalletClick = () => {
    window.open('https://billing.stripe.com/p/login/eVa3do9YM74Pdy09AA', '_blank');
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader size="lg" />
      </div>;
  }
  return <>
      <Helmet>
        <title>Portail Numerily - Clients & Partenaires</title>
        <meta name="description" content="Bienvenue sur le portail Numerily. Connectez-vous pour accéder à vos services et outils, que vous soyez client ou partenaire." />
        <meta property="og:title" content="Portail Numerily - Clients & Partenaires" />
        <meta property="og:description" content="Bienvenue sur le portail Numerily. Connectez-vous pour accéder à vos services et outils, que vous soyez client ou partenaire." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Helmet>
      
      <div className="min-h-screen relative overflow-x-hidden bg-background">
        {user && profile && <Sidebar profile={profile} isExpanded={isSidebarExpanded} setIsExpanded={setIsSidebarExpanded} />}
        
        <div className={cn("flex flex-col flex-1 transition-all duration-300", user ? isSidebarExpanded ? 'md:ml-64' : 'md:ml-20' : '')}>
            {user && <header className={cn("fixed top-0 left-0 right-0 p-4 z-20 transition-all duration-300", isSidebarExpanded ? 'md:ml-64 bg-background/80 backdrop-blur-sm border-b border-border/50' : 'md:ml-20 bg-background/80 backdrop-blur-sm border-b border-border/50')}>
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                  <Link to="/dashboard">
                    <img src="https://horizons-cdn.hostinger.com/1dfec302-4fd6-4f8b-a330-41699fd1c70b/51696dd85bc2c9a642b507e263454151.png" alt="Numerily Logo" className="h-8" />
                  </Link>
                  {profile && <div className="flex items-center gap-6">
                            {profile.role === 'user' && <Button variant="ghost" size="icon" onClick={handleWalletClick} aria-label="Portefeuille">
                                  <Wallet className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                              </Button>}
                            <NotificationDropdown />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar>
                                      <AvatarImage src={profile.avatar_url} alt={profile.name} />
                                      <AvatarFallback>
                                        {profile.name ? profile.name.charAt(0).toUpperCase() : <UserIcon size={18} />}
                                      </AvatarFallback>
                                    </Avatar>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <p className="font-bold">{profile.name}</p>
                                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Tableau de bord</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                       <Link to="/settings"><Settings className="mr-2 h-4 w-4" />Paramètres</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-400">
                                        <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>}
                  </div>
              </header>}

            <main className="relative z-10 w-full">
                 <div className={cn("w-full", user ? 'max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12' : 'min-h-screen flex items-center justify-center')}>
                    <AppContent onLogin={() => setAuthMode('login')} onSignup={() => setAuthMode('signup')} />
                </div>
            </main>
        </div>
        <AnimatePresence>
          {authMode && <AuthForm mode={authMode} setMode={setAuthMode} />}
        </AnimatePresence>
      </div>
    </>;
}
const Root = () => <Router>
        <App />
    </Router>;
export default Root;