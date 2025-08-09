import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { KanbanBoard, KanbanBoardContainer } from './kanban/board';
import { KanbanColumn, KanbanColumnSkeleton } from './kanban/column';
import { KanbanItem } from './kanban/item';
import { VerificationCard, VerificationCardSkeleton } from './kanban/verification-card';
import { supabase } from '@/providers/supabaseClient';

// Types for verification data
interface Verification {
  id: number;
  user_id: string;
  national_id_image_url: string | null;
  license_image_url: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  user?: {
    email?: string;
    name?: string;
    avatar_url?: string;
  };
}

// Define verification data types
interface Verification {
  id: number;
  user_id: string;
  national_id_image_url: string | null;
  license_image_url: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  user?: {
    email?: string;
    name?: string;
    avatar_url?: string;
  };
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
      console.log('Fetching verification requests...');
      setIsLoading(true);
      const { data, error } = await supabase
        .from('verification')
        .select(`
          *,
          user:user_id (id, email, name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched verifications:', data);
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast.error('Failed to load verification requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // Group verifications by status
  const groupedVerifications = useMemo(() => {
    return verifications.reduce((acc, verification) => {
      const status = verification.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(verification);
      return acc;
    }, {} as Record<string, Verification[]>);
  }, [verifications]);

  const handleStatusChange = async (id: number, newStatus: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    try {
      const { error } = await supabase
        .from('verification')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(`Verification ${newStatus.toLowerCase()} successfully`);
      fetchVerifications();
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast.error('Failed to update verification status');
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

  if (isLoading) return <PageSkeleton />;

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
                        verification={verification}
                        onStatusChange={async (status) => 
                          handleStatusChange(verification.id, status)
                        }
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
