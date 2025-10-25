import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, MonitorPlay } from 'lucide-react';

const QuickAssistGuidePage = () => {
    const installLink = "https://apps.microsoft.com/detail/9P7BP5VNWKX5?hl=fr-fr&gl=FR&ocid=pdpshare";

    return (
        <>
            <Helmet>
                <title>Préparation au Dépannage - Numerily</title>
                <meta name="description" content="Guide pour installer l'Assistance rapide de Windows en vue de votre session de dépannage à distance." />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl mx-auto space-y-8"
            >
                <div className="text-center">
                    <MonitorPlay className="mx-auto h-12 w-12 text-primary mb-4" />
                    <h1 className="text-4xl font-bold text-foreground">Préparez votre session de dépannage</h1>
                    <p className="text-lg text-muted-foreground mt-2">
                        Pour que notre technicien puisse vous aider, veuillez installer l'outil "Assistance rapide" de Windows.
                    </p>
                </div>

                <Card className="overflow-hidden shadow-lg">
                    <CardHeader className="bg-secondary">
                        <CardTitle className="text-2xl">Installation de l'Assistance rapide</CardTitle>
                        <CardDescription>
                            Cet outil sécurisé nous permettra de nous connecter à votre ordinateur avec votre autorisation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">Étape 1 : Télécharger l'application</h2>
                            <p className="text-muted-foreground mb-4">
                                Cliquez sur le bouton ci-dessous pour ouvrir la page de l'application dans le Microsoft Store.
                                Cliquez ensuite sur "Obtenir" ou "Installer" sur la page du Store.
                            </p>
                            <Button
                                onClick={() => window.open(installLink, '_blank')}
                                className="w-full md:w-auto"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Installer l'Assistance rapide
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">Étape 2 : Au moment du rendez-vous</h2>
                            <p className="text-muted-foreground">
                                Au début de votre session de dépannage, notre technicien vous donnera un code de sécurité.
                                Vous devrez ouvrir l'application "Assistance rapide" et entrer ce code pour autoriser la connexion.
                            </p>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-blue-200">
                            <p className="font-bold">Votre sécurité est notre priorité.</p>
                            <p className="text-sm text-blue-300/80">
                                La connexion est entièrement sécurisée et vous pourrez voir toutes les actions effectuées sur votre écran. Vous pouvez mettre fin à la session à tout moment.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </>
    );
};

export default QuickAssistGuidePage;