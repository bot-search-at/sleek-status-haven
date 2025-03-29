
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiscordBotConfig } from "@/components/DiscordBotConfig";
import { useAuth } from "@/context/AuthContext";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const { user } = useAuth();

  useEffect(() => {
    // Initialize the active tab from the URL if present
    const hash = window.location.hash.replace('#', '');
    if (hash && ['account', 'notifications', 'integrations'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update the URL when the tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Einstellungen</CardTitle>
              <CardDescription>
                Du musst angemeldet sein, um auf diese Seite zuzugreifen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = '/login'}>Anmelden</Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Einstellungen</h1>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-8">
            <TabsTrigger value="account">Konto</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="integrations">Integrationen</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Kontoeinstellungen</CardTitle>
                <CardDescription>
                  Verwalte deine Kontoeinstellungen und Präferenzen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Kontoeinstellungen werden noch implementiert.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Benachrichtigungseinstellungen</CardTitle>
                <CardDescription>
                  Konfiguriere, wie du über Statusänderungen benachrichtigt werden möchtest.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Benachrichtigungseinstellungen werden noch implementiert.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <DiscordBotConfig />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
