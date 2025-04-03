
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  
  useEffect(() => {
    // Check if user has already given consent
    const consentGiven = localStorage.getItem('cookieConsent');
    if (!consentGiven) {
      // Small delay before showing the banner for better UX
      const timer = setTimeout(() => {
        setShowConsent(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShowConsent(false);
  };
  
  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'false');
    setShowConsent(false);
  };
  
  if (!showConsent) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t border-border shadow-lg">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 pr-8">
            <h3 className="text-base font-semibold mb-2">Cookie-Hinweis</h3>
            <p className="text-sm text-muted-foreground">
              Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. 
              Durch die Nutzung unserer Website stimmen Sie der Verwendung von Cookies gemäß unserer{' '}
              <Link to="/datenschutz" className="text-primary hover:underline">
                Datenschutzerklärung
              </Link>{' '}
              zu.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-2 md:mt-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={declineCookies}
              className="rounded-full"
            >
              Ablehnen
            </Button>
            <Button 
              size="sm"
              onClick={acceptCookies}
              className="rounded-full"
            >
              Akzeptieren
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={declineCookies}
              className="absolute top-2 right-2 md:hidden"
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
