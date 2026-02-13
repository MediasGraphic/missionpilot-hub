import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, Bell, Palette } from "lucide-react";

const users = [
  { name: "Marie Durand", email: "m.durand@cabinet.fr", role: "Admin", active: true },
  { name: "Jean Martin", email: "j.martin@cabinet.fr", role: "Chef de projet", active: true },
  { name: "Sophie Leclerc", email: "s.leclerc@cabinet.fr", role: "Chargée d'études", active: true },
  { name: "Pierre Moreau", email: "p.moreau@cabinet.fr", role: "Consultant", active: false },
];

export default function Admin() {
  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Administration</h1>
          <p className="text-muted-foreground text-sm mt-1">Paramètres et gestion des utilisateurs</p>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{users.length} utilisateurs</p>
              <Button size="sm">Inviter un utilisateur</Button>
            </div>
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Nom</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Rôle</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{user.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{user.role}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block h-2 w-2 rounded-full ${user.active ? "bg-success" : "bg-muted-foreground/40"}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="glass-card p-5 space-y-6 max-w-lg">
              <div className="space-y-2">
                <Label>Nom de l'organisation</Label>
                <Input defaultValue="Cabinet Études & Co" className="bg-secondary/50" />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Module Concertation</p>
                  <p className="text-xs text-muted-foreground">Activer la collecte multi-canal par projet</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Assistant IA</p>
                  <p className="text-xs text-muted-foreground">Suggestions de planning et analyse</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <div className="glass-card p-5 space-y-4 max-w-lg">
              {["Échéance livrable à J-3", "Nouveau document ajouté", "Validation client reçue", "Alerte glissement planning"].map((notif) => (
                <div key={notif} className="flex items-center justify-between">
                  <p className="text-sm">{notif}</p>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
