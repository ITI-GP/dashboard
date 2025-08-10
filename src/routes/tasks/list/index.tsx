import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { message } from 'antd';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { KanbanBoard, KanbanBoardContainer } from './kanban/board';
import { KanbanColumn, KanbanColumnSkeleton } from './kanban/column';
import { KanbanItem } from './kanban/item';
import { VerificationCard, VerificationCardSkeleton } from './kanban/verification-card';
import { supabase } from '@/providers/supabaseClient';

// Types for verification data
export interface UserInfo {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

interface Verification {
  id: number;
  user_id: string;
  national_id_image_url: string | null;
  license_image_url: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  user?: UserInfo | null; // Make user optional and allow null
}

// Define verification stages
const VERIFICATION_STAGES = [
  { id: '1', title: 'Pending', status: 'PENDING' },
  { id: '2', title: 'Approved', status: 'APPROVED' },
  { id: '3', title: 'Rejected', status: 'REJECTED' }
] as const;

// Using the Supabase client from the provider

export const TasksListPage = ({ children }: React.PropsWithChildren) => {
  const { list } = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [verifications, setVerifications] = useState<Verification[]>([]);

  // Fetch verification requests from Supabase
  const fetchVerifications = useCallback(async () => {
    try {
      console.log('🔍 Fetching verification requests...');
      setIsLoading(true);
      
      // Log the Supabase client configuration
      console.log('🔧 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      // First, fetch the verification data
      console.log('📡 Fetching verification data...');
      const { data: verificationsData, error: verificationError } = await supabase
        .from('verification')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📡 Verification data response:', { 
        count: verificationsData?.length || 0, 
        error: verificationError 
      });

      if (verificationError) {
        console.error('❌ Error fetching verification data:', verificationError);
        throw verificationError;
      }
      
      if (!verificationsData || verificationsData.length === 0) {
        console.warn('⚠️ No verification records found in the database');
        setVerifications([]);
        return;
      }
      
      console.log(`✅ Fetched ${verificationsData.length} verification records`);
      
      // Extract unique user IDs from the verification data
      const userIds = [...new Set(verificationsData.map(v => v.user_id))];
      console.log('👥 Found user IDs:', userIds);
      
      // Fetch user data for these IDs
      let usersMap = new Map();
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, name, avatar_url')
          .in('id', userIds);
          
        if (usersError) {
          console.warn('⚠️ Could not fetch user data:', usersError);
        } else if (usersData && usersData.length > 0) {
          // Create a map of user ID to user data for easy lookup
          usersMap = new Map(usersData.map(user => [user.id, user]));
          console.log(`✅ Fetched data for ${usersData.length} users`);
        }
      }
      
      // Combine verification data with user data
      const enrichedVerifications = verificationsData.map(verification => ({
        ...verification,
        user: usersMap.get(verification.user_id) || null
      }));
      
      console.log('📝 Sample enriched verification record:', 
        JSON.stringify(enrichedVerifications[0], null, 2));
      
      setVerifications(enrichedVerifications);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error fetching verification requests:', error);
      toast.error(`Failed to load verification requests: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // Group verifications by status with additional logging
  const groupedVerifications = useMemo(() => {
    console.log('📊 Grouping verifications by status...');
    const groups = verifications.reduce((acc, verification) => {
      if (!verification || !verification.status) {
        console.warn('⚠️ Verification record missing status:', verification);
        return acc;
      }
      
      // Normalize status to uppercase to handle case sensitivity
      const status = verification.status.toUpperCase();
      
      if (!acc[status]) {
        console.log(`🆕 New status group: ${status}`);
        acc[status] = [];
      }
      
      acc[status].push(verification);
      return acc;
    }, {} as Record<string, Verification[]>);
    
    console.log('📋 Verification groups:', Object.keys(groups));
    Object.entries(groups).forEach(([status, items]) => {
      console.log(`  - ${status}: ${items.length} items`);
    });
    
    return groups;
  }, [verifications]);

  const handleStatusChange = async (verification: { id: number; user_id: string; status: string }, newStatus: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<void> => {
    const loadingKey = 'verification-update';
    message.loading({ content: 'Updating verification status...', key: loadingKey });
    
    try {
      // Update only the verification status
      const { error: verificationError } = await supabase
        .from('verification')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', verification.id);

      if (verificationError) throw verificationError;

      // Show success message with status
      message.success({
        content: `Verification ${newStatus.toLowerCase()} successfully`,
        key: loadingKey,
        duration: 3
      });

      // Refresh data
      await fetchVerifications();
      
      // No return value needed
    } catch (error) {
      console.error('Verification update error:', error);
      
      // Show specific error message based on error type
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update verification status. Please try again.';
      
      message.error({
        content: errorMessage,
        key: loadingKey,
        duration: 5
      });
      
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription...');
    const subscription = supabase
      .channel('verification_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'verification' 
        },
        (payload) => {
          console.log('Change received:', payload);
          fetchVerifications();
        }
      )
      .subscribe((status, err) => {
        console.log('Subscription status:', status);
        if (err) console.error('Subscription error:', err);
      });

    return () => {
      console.log('Cleaning up subscription...');
      supabase.removeChannel(subscription);
    };
  }, [fetchVerifications]);

  if (isLoading) {
    console.log('🔄 Loading verification data...');
    return <PageSkeleton />;
  }

  const handleDragEnd = () => {
    // Handle drag end logic here if needed
  };

  return (
    <div style={{ padding: '24px' }}>
      <KanbanBoardContainer>
        <KanbanBoard onDragEnd={handleDragEnd}>
          {VERIFICATION_STAGES.map((stage) => {
            const verificationsInStage = groupedVerifications[stage.status] || [];
            return (
              <KanbanColumn
                key={stage.id}
                id={stage.id}
                title={stage.title}
                count={verificationsInStage.length}
              >
                {isLoading ? (
                  <>
                    <VerificationCardSkeleton />
                    <VerificationCardSkeleton />
                  </>
                ) : verificationsInStage.length > 0 ? (
                  verificationsInStage.map((verification) => (
                    <KanbanItem 
                      key={verification.id} 
                      id={verification.id.toString()} 
                      data={verification}
                    >
                      <VerificationCard 
                        key={verification.id}
                        verification={verification}
                        onStatusChange={handleStatusChange}
                      />
                    </KanbanItem>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#666' }}>
                    No {stage.title.toLowerCase()} verifications
                  </div>
                )}
              </KanbanColumn>
            );
          })}
        </KanbanBoard>
      </KanbanBoardContainer>
      {children}
    </div>
  );
};

const PageSkeleton = () => {
  const columnCount = VERIFICATION_STAGES.length;
  const itemCount = 3;

  const handleDragEnd = () => {
    // No-op for skeleton
  };

  return (
    <div style={{ padding: '24px' }}>
      <KanbanBoardContainer>
        <KanbanBoard onDragEnd={handleDragEnd}>
          {Array.from({ length: columnCount }).map((_, index) => (
            <KanbanColumnSkeleton key={index}>
              {Array.from({ length: itemCount }).map((_, idx) => (
                <VerificationCardSkeleton key={`skeleton-${index}-${idx}`} />
              ))}
            </KanbanColumnSkeleton>
          ))}
        </KanbanBoard>
      </KanbanBoardContainer>
    </div>
  );
};
