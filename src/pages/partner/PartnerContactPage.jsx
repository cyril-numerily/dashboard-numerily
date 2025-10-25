import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PartnerContactTab from '@/components/partner/PartnerContactTab';
import CalEmbed from '@/components/CalEmbed';

const PartnerContactPage = () => {
    return (
        <>
            <Helmet>
                <title>Contacter Numerily</title>
            </Helmet>
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Contacter Numerily</CardTitle>
                    <CardDescription>Posez vos questions ou prenez rendez-vous.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="message" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="message">Message</TabsTrigger>
                            <TabsTrigger value="appointment">Prendre rendez-vous</TabsTrigger>
                        </TabsList>
                        <TabsContent value="message">
                            <PartnerContactTab />
                        </TabsContent>
                        <TabsContent value="appointment">
                            <div className="mt-4 rounded-lg overflow-hidden">
                                <CalEmbed />
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
};

export default PartnerContactPage;