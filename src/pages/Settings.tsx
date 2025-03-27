
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
import { User, Save, BellRing, Mail, Shield, Paintbrush } from "lucide-react";

// Define the form schema for user profile
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  company: z.string().optional(),
  job_title: z.string().optional(),
});

// Define the form schema for appearance
const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

// Define the form schema for notifications
const notificationsFormSchema = z.object({
  email_notifications: z.boolean().default(true),
  push_notifications: z.boolean().default(true),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;
type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with default values
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.user_metadata?.full_name || "",
      email: user?.email || "",
      company: user?.user_metadata?.company || "",
      job_title: user?.user_metadata?.job_title || "",
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
        description: "Your profile information has been updated.",
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
                    
                    <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {isLoading ? "Saving..." : "Save changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Manage how you receive notifications.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Configure your notification preferences.
                </p>
                
                <div className="grid gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications about incidents and updates.
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="font-medium">Browser Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Get notifications directly in your browser.
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
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
                  <div className="space-y-2">
                    <h3 className="font-medium">Theme</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="outline" className="justify-start px-3 py-6 h-auto aspect-[1.6/1]">
                        <span className="flex flex-col items-center text-center">
                          <span className="text-xs">Light</span>
                        </span>
                      </Button>
                      <Button variant="outline" className="justify-start px-3 py-6 h-auto aspect-[1.6/1]">
                        <span className="flex flex-col items-center text-center">
                          <span className="text-xs">Dark</span>
                        </span>
                      </Button>
                      <Button variant="outline" className="justify-start px-3 py-6 h-auto aspect-[1.6/1]">
                        <span className="flex flex-col items-center text-center">
                          <span className="text-xs">System</span>
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="ml-auto">Save preferences</Button>
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
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your password to keep your account secure.
                    </p>
                    <Button variant="outline" size="sm">Change password</Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account.
                    </p>
                    <Button variant="outline" size="sm">Configure 2FA</Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-destructive">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data.
                    </p>
                    <Button variant="destructive" size="sm">Delete account</Button>
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
