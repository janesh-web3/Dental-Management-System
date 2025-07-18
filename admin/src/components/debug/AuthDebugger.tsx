import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { clearAuthData, isAuthenticated } from '@/utils/clearAuth';

const AuthDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = React.useState<any>({});

  const collectDebugInfo = () => {
    const token = sessionStorage.getItem('token');
    const doctorToken = sessionStorage.getItem('doctorToken');
    
    let tokenInfo = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        tokenInfo = {
          userId: payload.id || payload.userId,
          exp: payload.exp,
          iat: payload.iat,
          expired: payload.exp < Date.now() / 1000
        };
      } catch (error) {
        tokenInfo = { error: 'Invalid token format' };
      }
    }

    setDebugInfo({
      hasToken: !!token,
      hasDoctorToken: !!doctorToken,
      tokenInfo,
      isAuthenticatedCheck: isAuthenticated(),
      sessionStorageItems: Object.keys(sessionStorage).length,
      localStorageItems: Object.keys(localStorage).length,
    });
  };

  React.useEffect(() => {
    collectDebugInfo();
  }, []);

  const handleClearAuth = () => {
    clearAuthData();
    collectDebugInfo();
    alert('Authentication data cleared! Please refresh the page and login again.');
  };

  const handleForceLogin = () => {
    clearAuthData();
    window.location.href = '/auth/signin';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Auth Debug Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {debugInfo.hasToken 
                ? `Token: ${debugInfo.tokenInfo?.expired ? 'EXPIRED' : 'Valid'}`
                : 'No token found'
              }
            </AlertDescription>
          </Alert>
          
          <div className="text-xs space-y-1">
            <p>Has Token: {debugInfo.hasToken ? '✅' : '❌'}</p>
            <p>Has Doctor Token: {debugInfo.hasDoctorToken ? '✅' : '❌'}</p>
            <p>Is Authenticated: {debugInfo.isAuthenticatedCheck ? '✅' : '❌'}</p>
            <p>Session Items: {debugInfo.sessionStorageItems}</p>
            <p>Local Items: {debugInfo.localStorageItems}</p>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={collectDebugInfo}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={handleClearAuth}
              className="flex-1"
            >
              Clear Auth
            </Button>
          </div>

          <Button 
            size="sm" 
            variant="default" 
            onClick={handleForceLogin}
            className="w-full"
          >
            <LogOut className="h-3 w-3 mr-1" />
            Force Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDebugger;