
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageLayout } from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { User, Save, BellRing, Mail, Shield, Paintbrush, Upload, Camera } from "lucide-react";

// Define the form schema for user profile
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  company: z.string().optional(),
  job_title: z.string().optional(),
  bio: z.string().max(160).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

// Define the form schema for appearance
const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

// Define the form schema for notifications
const notificationsFormSchema = z.object({
  email_notifications: z.boolean().default(true),
  push_notifications: z.boolean().default(true),
  incident_alerts: z.boolean().default(true),
  maintenance_alerts: z.boolean().default(true),
  status_updates: z.boolean().default(true),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;
type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url || null);

  // Get initials for avatar fallback
  const getInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Initialize form with default values
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.user_metadata?.full_name || "",
      email: user?.email || "",
      company: user?.user_metadata?.company || "",
      job_title: user?.user_metadata?.job_title || "",
      bio: user?.user_metadata?.bio || "",
      website: user?.user_metadata?.website || "",
    },
  });

  // Initialize notifications form
  const notificationsForm = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      email_notifications: true,
      push_notifications: true,
      incident_alerts: true,
      maintenance_alerts: true,
      status_updates: true,
    },
  });

  // Form submission handler for profile form
  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    
    try {
      // In a real app, you would save this data to your backend
      console.log("Profile data submitted:", data);
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock function to handle avatar upload
  const handleAvatarUpload = () => {
    toast({
      title: "Avatar upload",
      description: "This feature is not implemented yet.",
    });
  };

  // Form submission handler for notifications form
  const onNotificationsSubmit = async (data: NotificationsFormValues) => {
    console.log("Notification settings:", data);
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated.",
    });
  };

  return (
    <PageLayout>
      <div className="container max-w-5xl animate-fade-in py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Paintbrush className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Manage your public profile information.
                </CardDescription>
              </CardHeader>
              <Separator />

              <CardContent className="pt-6">
                <div className="flex flex-col gap-8 md:flex-row">
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarUrl || ""} alt="Profile" />
                      <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleAvatarUpload} className="flex items-center gap-1">
                        <Camera className="h-4 w-4" />
                        <span>Change</span>
                      </Button>
                      {avatarUrl && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setAvatarUrl(null)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormDescription>
                                  This is the name that will be displayed on your profile.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your email" {...field} disabled />
                                </FormControl>
                                <FormDescription>
                                  Your email address is used for notifications and login.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={profileForm.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your company" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="job_title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your job title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4">
                          <FormField
                            control={profileForm.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Tell us a little about yourself" 
                                    className="resize-none" 
                                    rows={3} 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Brief description for your profile. Max 160 characters.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4">
                          <FormField
                            control={profileForm.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://your-website.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          {isLoading ? "Saving..." : "Save changes"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Choose how and when you want to be notified.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <Form {...notificationsForm}>
                  <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-8">
                    <div className="space-y-6">
                      <div className="flex flex-col space-y-4">
                        <h3 className="font-medium text-lg">Notification Channels</h3>
                        <div className="space-y-4">
                          <FormField
                            control={notificationsForm.control}
                            name="email_notifications"
                            render={({ field }) => (
                              <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Email Notifications</FormLabel>
                                  <FormDescription>
                                    Receive notifications via email
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                          
                          <FormField
                            control={notificationsForm.control}
                            name="push_notifications"
                            render={({ field }) => (
                              <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Browser Notifications</FormLabel>
                                  <FormDescription>
                                    Receive notifications in your browser
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="flex flex-col space-y-4">
                        <h3 className="font-medium text-lg">Notification Types</h3>
                        <div className="space-y-4">
                          <FormField
                            control={notificationsForm.control}
                            name="incident_alerts"
                            render={({ field }) => (
                              <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Incident Alerts</FormLabel>
                                  <FormDescription>
                                    Get notified about new incidents
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                          
                          <FormField
                            control={notificationsForm.control}
                            name="maintenance_alerts"
                            render={({ field }) => (
                              <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Maintenance Alerts</FormLabel>
                                  <FormDescription>
                                    Get notified about scheduled maintenance
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                          
                          <FormField
                            control={notificationsForm.control}
                            name="status_updates"
                            render={({ field }) => (
                              <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Status Updates</FormLabel>
                                  <FormDescription>
                                    Get notified about service status changes
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save preferences
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the status page looks.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Choose your preferred theme and display options.
                </p>
                
                <div className="grid gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="overflow-hidden rounded-md border-2 border-primary/10 hover:border-primary/50 transition-all">
                        <button className="w-full h-full p-4 text-center focus:outline-none">
                          <div className="rounded-md bg-white p-2 shadow-sm mb-2">
                            <div className="h-10 w-full rounded-md bg-[#f8f9fa]"></div>
                          </div>
                          <span className="text-sm font-medium">Light</span>
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-md border-2 border-primary/10 hover:border-primary/50 transition-all">
                        <button className="w-full h-full p-4 text-center focus:outline-none">
                          <div className="rounded-md bg-slate-950 p-2 shadow-sm mb-2">
                            <div className="h-10 w-full rounded-md bg-slate-800"></div>
                          </div>
                          <span className="text-sm font-medium">Dark</span>
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-md border-2 border-primary hover:border-primary/80 transition-all">
                        <button className="w-full h-full p-4 text-center focus:outline-none">
                          <div className="rounded-md bg-gradient-to-br from-white to-slate-950 p-2 shadow-sm mb-2">
                            <div className="h-10 w-full rounded-md bg-gradient-to-r from-[#f8f9fa] to-slate-800"></div>
                          </div>
                          <span className="text-sm font-medium">System</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and authentication methods.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h3 className="font-medium text-lg">Change Password</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your password to keep your account secure.
                    </p>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        Change password
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="font-medium text-lg">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account with two-factor authentication.
                    </p>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Two-factor authentication is not enabled</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Protect your account with an additional security layer
                          </p>
                        </div>
                        <Button>Set up 2FA</Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="font-medium text-lg text-destructive">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data.
                    </p>
                    <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                      <div className="flex flex-col space-y-3">
                        <h4 className="font-medium">Delete account</h4>
                        <p className="text-sm text-muted-foreground">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <div>
                          <Button variant="destructive" size="sm">Delete account</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
