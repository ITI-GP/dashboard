import React, { ReactNode } from 'react';
import { Card, Avatar, Typography, Button, Space, Divider, Tag } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined, FileImageOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { supabase } from '@/providers/supabaseClient';

// Import the UserInfo type from the parent component
import type { UserInfo } from '../index';

// Define Verification interface here since it's not exported from index
interface Verification {
  id: number;
  user_id: string;
  national_id_image_url: string | null;
  license_image_url: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  user?: UserInfo | null;
}

const { Text, Title } = Typography;

interface VerificationCardProps {
  verification: Verification;
  onStatusChange?: (status: 'PENDING' | 'APPROVED' | 'REJECTED') => Promise<void>;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({ 
  verification,
  onStatusChange 
}) => {
  console.log('🔄 Rendering VerificationCard for verification:', verification.id);
  
  const handleStatusUpdate = async (newStatus: 'APPROVED' | 'REJECTED') => {
    console.log(`🔄 Updating verification ${verification.id} status to ${newStatus}`);
    
    try {
      if (onStatusChange) {
        console.log('Using parent component status update handler');
        await onStatusChange(newStatus);
      } else {
        console.log('Using direct Supabase update');
        const { data, error } = await supabase
          .from('verification')
          .update({ 
            status: newStatus, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', verification.id)
          .select()
          .single();
        
        console.log('Update response:', { data, error });
        
        if (error) {
          console.error('❌ Supabase update error:', error);
          throw error;
        }
        
        console.log('✅ Verification status updated successfully');
      }
      
      // Show success message
      toast.success(`✅ Verification ${newStatus.toLowerCase()} successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error updating verification status:', error);
      toast.error(`Failed to update verification status: ${errorMessage}`);
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'processing' | 'warning' | 'default' => {
    console.log(`Getting color for status: ${status}`);
    const statusUpper = status ? status.toUpperCase() : 'UNKNOWN';
    
    switch (statusUpper) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'processing';
      default:
        console.warn(`⚠️ Unknown status: ${status}`);
        return 'warning';
    }
  };

  const renderCardTitle = (): ReactNode => {
    // Ensure we have a valid user_id before trying to substring it
    const userIdDisplay = verification.user_id && verification.user_id.length >= 8 
      ? verification.user_id.substring(0, 8) 
      : 'user';
      
    return (
      <Space>
        <Avatar 
          src={verification.user?.avatar_url} 
          icon={!verification.user?.avatar_url ? <UserOutlined /> : undefined} 
        />
        <Text strong>{verification.user?.name || `User ${userIdDisplay}`}</Text>
      </Space>
    );
  };

  return (
    <Card 
      size="small"
      style={{ marginBottom: 16 }}
      title={renderCardTitle()}
      extra={
        <Tag color={getStatusColor(verification.status)}>
          {verification.status}
        </Tag>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">
          Submitted: {verification.created_at ? new Date(verification.created_at).toLocaleString() : 'N/A'}
        </Text>
        {verification.updated_at && verification.updated_at !== verification.created_at && (
          <div>
            <Text type="secondary" style={{ fontSize: '0.8em' }}>
              Last updated: {new Date(verification.updated_at).toLocaleString()}
            </Text>
          </div>
        )}
      </div>
      
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {verification.national_id_image_url && (
          <div>
            <Text strong>National ID:</Text>
            <div style={{ marginTop: 4 }}>
              <a 
                href={verification.national_id_image_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button 
                  type="link" 
                  icon={<FileImageOutlined />}
                  style={{ padding: 0 }}
                >
                  View ID Document
                </Button>
              </a>
            </div>
          </div>
        )}
        
        {verification.license_image_url && (
          <div>
            <Text strong>License:</Text>
            <div style={{ marginTop: 4 }}>
              <a 
                href={verification.license_image_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button 
                  type="link" 
                  icon={<FileImageOutlined />}
                  style={{ padding: 0 }}
                >
                  View License Document
                </Button>
              </a>
            </div>
          </div>
        )}
      </Space>
      
      {verification.status === 'PENDING' && onStatusChange && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              onClick={() => handleStatusUpdate('APPROVED')}
            >
              Approve
            </Button>
            <Button 
              danger 
              icon={<CloseOutlined />}
              onClick={() => handleStatusUpdate('REJECTED')}
            >
              Reject
            </Button>
          </Space>
        </>
      )}
    </Card>
  );
};

export const VerificationCardSkeleton: React.FC = () => {
  return (
    <Card size="small" style={{ marginBottom: 16, width: '100%' }} loading>
      <Card.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={
          <div style={{ 
            width: '100px', 
            height: '16px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '2px' 
          }} />
        }
        description={
          <div style={{ 
            marginTop: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ 
              width: '80%', 
              height: '14px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '2px' 
            }} />
            <div style={{ 
              width: '60%', 
              height: '14px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '2px' 
            }} />
          </div>
        }
      />
    </Card>
  );
};
