import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from 'lucide-react';

const PartnerCalendarTab = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-white" />Calendrier Partagé</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="text-center py-16">
                        <p className="text-muted-foreground">La fonctionnalité de calendrier partagé est en cours de développement.</p>
                        <p className="text-sm text-muted-foreground mt-2">Vous pourrez bientôt voir ici les événements importants et les promotions à venir.</p>
                   </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default PartnerCalendarTab;