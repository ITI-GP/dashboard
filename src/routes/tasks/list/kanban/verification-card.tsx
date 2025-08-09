import React from 'react';
import { Card, Avatar, Typography, Button, Space, Divider, Tag } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined, FileImageOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { supabase } from '@/providers/supabaseClient';

// Define Verification interface here since it's not exported from index
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

const { Text, Title } = Typography;

interface VerificationCardProps {
  verification: Verification;
  onStatusChange?: (status: 'PENDING' | 'APPROVED' | 'REJECTED') => Promise<void>;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({ 
  verification,
  onStatusChange 
}) => {
  const handleStatusUpdate = async (newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      if (onStatusChange) {
        await onStatusChange(newStatus);
      } else {
        const { error } = await supabase
          .from('verification')
          .update({ 
            status: newStatus, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', verification.id);
        
        if (error) throw error;
      }
      
      // Show success message
      toast.success(`Verification ${newStatus.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast.error('Failed to update verification status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'processing';
    }
  };

  return (
    <Card 
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <Avatar 
            src={verification.user?.avatar_url} 
            icon={!verification.user?.avatar_url && <UserOutlined />} 
          />
          <Text strong>{verification.user?.name || `User ${verification.user_id.substring(0, 8)}`}</Text>
        </Space>
      }
      extra={
        <Tag color={getStatusColor(verification.status)}>
          {verification.status}
        </Tag>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">Submitted: {new Date(verification.created_at).toLocaleString()}</Text>
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
    <Card size="small" style={{ marginBottom: 16 }} loading>
      <Card.Meta 
        avatar={<Avatar icon={<UserOutlined />} />}
        title="Loading..."
        description="Loading verification details..."
      />
    </Card>
  );
};
