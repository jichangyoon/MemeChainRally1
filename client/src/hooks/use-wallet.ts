import { useState, useEffect } from 'react';
import { phantomWallet } from '@/lib/phantom';

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [samuBalance, setSamuBalance] = useState(0);
  const [balanceStatus, setBalanceStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [userDisconnected, setUserDisconnected] = useState(() => {
    // Check localStorage for user disconnect state
    return localStorage.getItem('wallet-disconnected') === 'true';
  });


  useEffect(() => {
    let mounted = true;
    
    const initializeWallet = async () => {
      const phantom = (window as any).phantom?.solana;
      
      // Check if user came back from /connected route (mobile deeplink return)
      const isComingFromPhantom = window.location.pathname === '/connected';
      if (isComingFromPhantom) {
        // Clear the route and try to connect
        window.history.replaceState({}, '', '/');
        
        // Wait a bit for Phantom to initialize after deeplink return
        setTimeout(async () => {
          if (phantom && phantom.isConnected && phantom.publicKey) {
            const publicKeyString = phantom.publicKey.toBase58();
            setIsConnected(true);
            setWalletAddress(formatAddress(publicKeyString));
            await updateBalances();
          }
        }, 1000);
        return;
      }
      
      if (!phantom || userDisconnected) {
        return;
      }
      
      try {
        // Check if already connected
        if (phantom.isConnected && phantom.publicKey) {
          const publicKeyString = phantom.publicKey.toBase58();
          if (mounted) {
            setIsConnected(true);
            setWalletAddress(formatAddress(publicKeyString));
            await updateBalances();
          }
        } else if (!userDisconnected) {
          // Try silent auto-connect only if user hasn't explicitly disconnected
          const response = await phantom.connect({ onlyIfTrusted: true });
          if (response.publicKey && mounted) {
            const publicKeyString = response.publicKey.toBase58();
            setIsConnected(true);
            setWalletAddress(formatAddress(publicKeyString));
            await updateBalances();
          }
        }
      } catch (error) {
        // Silent fail for auto-connect
        console.log('Auto-connect failed:', error);
      }
    };
    
    // Wait for phantom to be ready
    setTimeout(initializeWallet, 1000);
    
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const phantom = (window as any).phantom?.solana;
    if (!phantom) return;
    
    const handleAccountChange = (publicKey: any) => {
      if (publicKey) {
        const publicKeyString = publicKey.toBase58();
        setIsConnected(true);
        setWalletAddress(formatAddress(publicKeyString));
        updateBalances();
      } else {
        setIsConnected(false);
        setWalletAddress('');
        setSamuBalance(0);
        setBalanceStatus('idle');
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setWalletAddress('');
      setSamuBalance(0);
      setBalanceStatus('idle');
    };

    phantom.on('accountChanged', handleAccountChange);
    phantom.on('disconnect', handleDisconnect);
    
    return () => {
      phantom.off('accountChanged', handleAccountChange);
      phantom.off('disconnect', handleDisconnect);
    };
  }, []);

  const connect = async () => {
    try {
      setIsConnecting(true);
      
      // Reset disconnected flag when user explicitly connects
      setUserDisconnected(false);
      localStorage.removeItem('wallet-disconnected');
      
      const wallet = await phantomWallet.connect();
      
      setIsConnected(true);
      setWalletAddress(formatAddress(wallet.publicKey));
      
      // Force update balances after connection
      setTimeout(async () => {
        await updateBalances();
      }, 100);
    } catch (error) {
      const err = error as Error;
      if (err?.message === 'REDIRECT_TO_PHANTOM') {
        // Mobile redirect to Phantom app - don't show error, just inform user
        console.log('Redirecting to Phantom app for mobile connection...');
        return;
      }
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      // Set user disconnected flag and store in localStorage
      setUserDisconnected(true);
      localStorage.setItem('wallet-disconnected', 'true');
      
      // Disconnect from phantom
      const phantom = (window as any).phantom?.solana;
      if (phantom) {
        await phantom.disconnect();
      }
      
      // Disconnect from our wrapper
      await phantomWallet.disconnect();
      
      // Reset all state
      setIsConnected(false);
      setWalletAddress('');
      setSamuBalance(0);
      setBalanceStatus('idle');
      
      console.log('Wallet disconnected successfully');
      
      // Force page refresh to completely reset all state
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      // Force reset state even if disconnect fails
      setIsConnected(false);
      setWalletAddress('');
      setSamuBalance(0);
      setBalanceStatus('idle');
      localStorage.setItem('wallet-disconnected', 'true');
      
      // Still refresh the page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const updateBalances = async () => {
    try {
      setBalanceStatus('loading');
      const balance = await phantomWallet.getSamuBalance();
      setSamuBalance(Math.floor(balance)); // Round down for display
      setBalanceStatus('success');
      
      // Ensure wallet is marked as connected if we successfully got balance
      const phantom = (window as any).phantom?.solana;
      if (phantom && phantom.isConnected && phantom.publicKey) {
        setIsConnected(true);
        setWalletAddress(formatAddress(phantom.publicKey.toBase58()));
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setSamuBalance(0);
      setBalanceStatus('error');
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return {
    isConnected,
    isConnecting,
    walletAddress,
    samuBalance,
    balanceStatus,
    votingPower: samuBalance, // Voting power based on SAMU balance only
    connect,
    disconnect,
    updateBalances
  };
}
