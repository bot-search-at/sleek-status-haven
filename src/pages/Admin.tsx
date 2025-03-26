
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { mockServices, mockIncidents, mockUsers } from "@/lib/mockData";
import { Service, Incident, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertTriangle, Lock, Plus, Settings, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function Admin() {
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Simulate API call and auth check
    setTimeout(() => {
      setServices(mockServices);
      setIncidents(mockIncidents);
      setUsers(mockUsers);
      setIsLoggedIn(false); // Set to false initially to demonstrate login flow
    }, 500);
  }, []);

  if (!isLoggedIn) {
    return (
      <PageLayout className="flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
            <p className="text-muted-foreground">
              Please log in to access the admin panel
            </p>
          </div>
          
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
              <CardDescription>
                Enter your credentials to access the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    className="w-full p-2 rounded-md border bg-background"
                    defaultValue="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full p-2 rounded-md border bg-background"
                    defaultValue="password"
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => setIsLoggedIn(true)}>
                Login
              </Button>
            </CardFooter>
          </Card>
          
          <div className="mt-4 text-center text-sm text-muted-foreground animate-fade-in">
            <Link to="/" className="text-primary hover:underline">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="mt-1 text-muted-foreground">
              Manage services, incidents, and system settings
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" className="gap-1">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span>New Incident</span>
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8 animate-fade-in">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{services.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {services.filter(s => s.status === "operational").length} operational
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Active Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {incidents.filter(i => i.status !== "resolved").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {incidents.filter(i => i.status === "investigating").length} investigating
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {users.filter(u => u.role === "admin").length} administrators
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-medium flex items-center gap-2">
                {services.some(s => ["major_outage", "partial_outage"].includes(s.status)) ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-status-degraded" />
                    <span>Degraded</span>
                  </>
                ) : (
                  <>
                    <div className="h-2.5 w-2.5 rounded-full bg-status-operational" />
                    <span>Operational</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {format(new Date(), "MMM d, h:mmaaa")}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="services" className="animate-fade-in">
          <TabsList className="mb-4">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Services</CardTitle>
                    <CardDescription>
                      Manage and monitor all system services
                    </CardDescription>
                  </div>
                  <Button size="sm" className="w-full sm:w-auto gap-1">
                    <Plus className="h-4 w-4" />
                    <span>Add Service</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map(service => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>
                            <StatusBadge status={service.status} />
                          </TableCell>
                          <TableCell>{service.group}</TableCell>
                          <TableCell>
                            {format(new Date(service.updatedAt), "MMM d, h:mmaaa")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">Edit</Button>
                              <Button variant="outline" size="sm">View</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="incidents">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Incidents</CardTitle>
                    <CardDescription>
                      Manage current and historical incidents
                    </CardDescription>
                  </div>
                  <Button size="sm" className="w-full sm:w-auto gap-1">
                    <Plus className="h-4 w-4" />
                    <span>Create Incident</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Incident</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Impact</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incidents.map(incident => (
                        <TableRow key={incident.id}>
                          <TableCell className="font-medium">{incident.title}</TableCell>
                          <TableCell>
                            <Badge className={
                              incident.status === "resolved" ? "bg-green-500" :
                              incident.status === "investigating" ? "bg-destructive" :
                              incident.status === "identified" ? "bg-amber-500" :
                              "bg-blue-500"
                            }>
                              {incident.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {incident.impact}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(incident.createdAt), "MMM d, h:mmaaa")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">Edit</Button>
                              <Button variant="outline" size="sm">Update</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                      Manage users and access permissions
                    </CardDescription>
                  </div>
                  <Button size="sm" className="w-full sm:w-auto gap-1">
                    <UserPlus className="h-4 w-4" />
                    <span>Add User</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "outline"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">Edit</Button>
                              <Button variant="outline" size="sm">Permissions</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure global settings for the status page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">General</h3>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <label htmlFor="site-name" className="text-sm font-medium">
                          Site Name
                        </label>
                        <input
                          id="site-name"
                          className="w-full p-2 rounded-md border bg-background"
                          defaultValue="Status Haven"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="site-description" className="text-sm font-medium">
                          Site Description
                        </label>
                        <textarea
                          id="site-description"
                          rows={3}
                          className="w-full p-2 rounded-md border bg-background"
                          defaultValue="Status monitoring for our platform and services"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Notifications</h3>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Email Notifications</div>
                          <div className="text-sm text-muted-foreground">
                            Send email notifications for new incidents
                          </div>
                        </div>
                        <div className="bg-primary w-12 h-6 rounded-full relative cursor-pointer">
                          <div className="h-5 w-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">SMS Notifications</div>
                          <div className="text-sm text-muted-foreground">
                            Send SMS alerts for critical incidents
                          </div>
                        </div>
                        <div className="bg-secondary w-12 h-6 rounded-full relative cursor-pointer">
                          <div className="h-5 w-5 bg-secondary-foreground rounded-full absolute left-0.5 top-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Appearance</h3>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">
                          Theme
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <input type="radio" id="light" name="theme" defaultChecked />
                            <label htmlFor="light">Light</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="radio" id="dark" name="theme" />
                            <label htmlFor="dark">Dark</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="radio" id="system" name="theme" />
                            <label htmlFor="system">System</label>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="primary-color" className="text-sm font-medium">
                          Primary Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="primary-color"
                            defaultValue="#3b82f6"
                            className="w-10 h-10 rounded-md overflow-hidden"
                          />
                          <input
                            type="text"
                            defaultValue="#3b82f6"
                            className="w-32 p-2 rounded-md border bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-4">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
