import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextValue {
  isOnline: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

const defaultValue: NetworkContextValue = {
  isOnline: true,
  isConnected: true,
  isInternetReachable: true,
};

const NetworkContext = createContext<NetworkContextValue>(defaultValue);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<NetworkContextValue>(defaultValue);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    // İlk durumu hemen kontrol et (sadece bir kez)
    const checkInitialState = async () => {
      try {
        const netState = await NetInfo.fetch();
        const isConnected = netState.isConnected ?? null;
        const isInternetReachable = netState.isInternetReachable ?? null;
        const isOnline = Boolean(isConnected && (isInternetReachable !== false));
        
        setState({
          isConnected,
          isInternetReachable,
          isOnline,
        });
        
        if (__DEV__) {
          console.log('[NetworkContext] Initial network state', {
            isConnected,
            isInternetReachable,
            isOnline,
          });
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[NetworkContext] Initial network state kontrolü hatası', error);
        }
      }
    };
    
    // İlk durumu kontrol et
    checkInitialState();
    
    // Tek kaynak: NetInfo.addEventListener - network değişikliklerini dinle
    try {
      unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
        try {
          const isConnected = netState.isConnected ?? null;
          const isInternetReachable = netState.isInternetReachable ?? null;
          const isOnline = Boolean(isConnected && (isInternetReachable !== false));
          
          // Sadece değer değiştiğinde state güncelle (re-render önleme)
          setState((prevState) => {
            if (
              prevState.isConnected !== isConnected ||
              prevState.isInternetReachable !== isInternetReachable ||
              prevState.isOnline !== isOnline
            ) {
              // Sadece değişiklik olduğunda log bas
              if (__DEV__) {
                console.log('[NetworkContext] Network state changed', {
                  isConnected,
                  isInternetReachable,
                  isOnline,
                });
              }
              return {
                isConnected,
                isInternetReachable,
                isOnline,
              };
            }
            // Değişiklik yoksa önceki state'i döndür (re-render önleme)
            return prevState;
          });
        } catch (error) {
          if (__DEV__) {
            console.warn('[NetworkContext] Network state güncelleme hatası', error);
          }
        }
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[NetworkContext] NetInfo listener oluşturma hatası', error);
      }
    }
    
    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          if (__DEV__) {
            console.warn('[NetworkContext] NetInfo listener kapatma hatası', error);
          }
        }
      }
    };
  }, []);

  return <NetworkContext.Provider value={state}>{children}</NetworkContext.Provider>;
};

export const useNetwork = () => useContext(NetworkContext);

