import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { WalletConnect } from "@/components/wallet-connect";
import { ContestHeader } from "@/components/contest-header";
import { UploadForm } from "@/components/upload-form";
import { MemeCard } from "@/components/meme-card";
import { Leaderboard } from "@/components/leaderboard";
import { GoodsShop } from "@/components/goods-shop";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Meme } from "@shared/schema";
import samuLogo1 from "@assets/photo_2025-05-26_08-40-22_1750170004880.jpg";

export default function Home() {
  const { isConnected, walletAddress, samuBalance, balanceStatus, updateBalances, isConnecting } = useWallet();
  
  // Debug log
  console.log('Wallet state:', { isConnected, walletAddress, samuBalance, balanceStatus });
  
  // Auto-refresh balance when wallet connects
  useEffect(() => {
    if (isConnected && samuBalance === 0) {
      updateBalances();
    }
  }, [isConnected, updateBalances]);
  const [sortBy, setSortBy] = useState("votes");
  const [currentTab, setCurrentTab] = useState("contest");

  const { data: memes = [], isLoading, refetch } = useQuery<Meme[]>({
    queryKey: ["/api/memes"],
    enabled: true,
  });

  const sortedMemes = memes.sort((a, b) => {
    if (sortBy === "votes") return b.votes - a.votes;
    if (sortBy === "latest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return b.votes - a.votes; // default to votes
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentTab("goods")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-[hsl(50,85%,75%)] flex items-center justify-center samu-wolf-logo">
                <img 
                  src={samuLogo1} 
                  alt="SAMU Wolf" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              </div>
              <span className="text-lg font-bold text-[hsl(201,30%,25%)]">SAMU</span>
            </button>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Wallet Status */}
      {isConnected && walletAddress && (
        <div className="max-w-md mx-auto px-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-600">Wallet Connected</span>
              </div>
              <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{walletAddress}</span>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border-2 border-[hsl(30,100%,50%)]">
                <div className="font-bold text-2xl text-[hsl(30,100%,50%)] mb-1">
                  {balanceStatus === 'loading' ? 'Checking...' : samuBalance.toLocaleString()}
                </div>
                <div className="text-sm font-medium opacity-75 mb-2">SAMU Tokens</div>
                
                {samuBalance > 0 && (
                  <div className="text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                    Voting Power: {samuBalance.toLocaleString()}
                  </div>
                )}
                
                {balanceStatus === 'loading' && (
                  <div className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-900/20 px-3 py-1 rounded">
                    Checking SAMU balance...
                  </div>
                )}
                
                {(balanceStatus === 'error' || (balanceStatus === 'success' && samuBalance === 0)) && (
                  <div className="mt-2">
                    <div className="text-xs text-amber-600 mb-2 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                      {balanceStatus === 'error' 
                        ? 'Token query failed - Network issue' 
                        : 'No SAMU tokens found'}
                    </div>
                    <Button 
                      onClick={updateBalances}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
                
                {balanceStatus === 'idle' && (
                  <div className="mt-2">
                    <Button 
                      onClick={updateBalances}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      Check Token Balance
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="max-w-md mx-auto px-4 py-3 bg-white border-b border-gray-200">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="contest" className="text-sm">Meme Contest</TabsTrigger>
            <TabsTrigger value="goods" className="text-sm">Goods Shop</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contest" className="mt-4">
            {/* Contest Sub-Navigation */}
            <Tabs defaultValue="contest-main" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10">
                <TabsTrigger value="contest-main" className="text-sm">Contest</TabsTrigger>
                <TabsTrigger value="leaderboard" className="text-sm">Leaderboard</TabsTrigger>
                <TabsTrigger value="my-memes" className="text-sm">My Memes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="contest-main" className="mt-0">
                <main className="space-y-4 pb-20">
                  {/* Contest Header */}
                  <ContestHeader />

                  {/* Upload Section */}
                  {isConnected && (
                    <UploadForm onSuccess={() => refetch()} />
                  )}

                  {/* Meme Gallery */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold text-[hsl(201,30%,25%)]">Contest Entries</h2>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-32 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="votes">Most Votes</SelectItem>
                          <SelectItem value="latest">Latest</SelectItem>
                          <SelectItem value="trending">Trending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Card key={i} className="animate-pulse">
                            <div className="aspect-square bg-gray-200" />
                            <CardContent className="p-4">
                              <div className="h-4 bg-gray-200 rounded mb-2" />
                              <div className="h-3 bg-gray-200 rounded w-3/4" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedMemes.map((meme) => (
                          <MemeCard 
                            key={meme.id} 
                            meme={meme} 
                            onVote={() => refetch()}
                            canVote={isConnected}
                          />
                        ))}
                        
                        {sortedMemes.length === 0 && (
                          <Card>
                            <CardContent className="p-8 text-center">
                              <p className="text-gray-500">No memes submitted yet. Be the first!</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {sortedMemes.length > 0 && (
                      <div className="text-center mt-6">
                        <Button variant="outline" className="bg-gray-100 hover:bg-gray-200">
                          Load More Memes
                        </Button>
                      </div>
                    )}
                  </div>
                </main>
              </TabsContent>
              
              <TabsContent value="leaderboard">
                <Leaderboard />
              </TabsContent>
              
              <TabsContent value="my-memes">
                <Card className="p-6 text-center">
                  <p className="text-gray-500">
                    {isConnected ? "Your submitted memes will appear here." : "Connect your wallet to view your memes."}
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="goods" className="mt-4">
            <GoodsShop />
          </TabsContent>
        </Tabs>
      </nav>
    </div>
  );
}
