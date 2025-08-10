import React, { ReactNode } from 'react';
import { Card, Typography, Avatar, Space, Tag, Image, Button, message, Divider } from 'antd';
import { 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined, 
  EyeOutlined,
  IdcardOutlined,
  CarOutlined,
  MailOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { supabase } from '@/providers/supabaseClient';

// Import the UserInfo type from the parent component
import type { UserInfo } from '../index';

// Define Verification interface
export interface Verification {
  id: number;
  user_id: string;
  national_id_image_url: string | null;
  license_image_url: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  created_at: string;
  updated_at: string;
  user?: UserInfo | null;
}

const { Text } = Typography;

// Skeleton component for loading state
export const VerificationCardSkeleton: React.FC = () => (
  <Card 
    size="small" 
    style={{ 
      marginBottom: 16, 
      borderRadius: 8,
      border: '1px solid #f0f0f0',
    }}
    loading
  >
    <Card.Meta
      avatar={<Avatar icon={<UserOutlined />} />}
      title="Loading..."
    />
  </Card>
);

interface VerificationCardProps {
  verification: Verification;
  onStatusChange: (verification: Verification, newStatus: 'PENDING' | 'APPROVED' | 'REJECTED') => Promise<void>;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({ verification, onStatusChange }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const getStatusColor = (status: string): string => {
    const statusUpper = status?.toUpperCase() || '';
    switch (statusUpper) {
      case 'PENDING':
        return 'orange';
      case 'APPROVED':
        return 'green';
      case 'REJECTED':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    const statusUpper = status?.toUpperCase() || '';
    switch (statusUpper) {
      case 'PENDING':
        return <ClockCircleOutlined />;
      case 'APPROVED':
        return <CheckCircleOutlined />;
      case 'REJECTED':
        return <CloseCircleOutlined />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleStatusUpdate = async (newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    try {
      setLoading(true);
      await onStatusChange(verification, newStatus);
      // Success is handled in the parent
    } catch (error) {
      // Error is already handled in the parent, just log it
      console.error('Error in verification update:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCardTitle = (): ReactNode => {
    const userIdDisplay = verification.user_id && verification.user_id.length >= 8 
      ? verification.user_id.substring(0, 8) 
      : 'user';
      
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Space>
          <Avatar 
            src={verification.user?.avatar_url} 
            icon={!verification.user?.avatar_url ? <UserOutlined /> : undefined} 
          />
          <Text strong style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {verification.user?.name || `User ${userIdDisplay}`}
          </Text>
        </Space>
        <Tag 
          color={getStatusColor(verification.status)}
          icon={getStatusIcon(verification.status)}
          style={{ marginLeft: 8, flexShrink: 0 }}
        >
          {verification.status}
        </Tag>
      </div>
    );
  };

  const renderDocumentPreview = (url: string, title: string, icon: ReactNode) => (
    <div style={{ 
      border: '1px solid #f0f0f0', 
      borderRadius: 8, 
      padding: 12,
      flex: 1,
      minWidth: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, color: '#666' }}>
        {icon}
        <Text style={{ marginLeft: 8 }}>{title}</Text>
      </div>
      <Image
        src={url}
        alt={title}
        style={{ 
          width: '100%',
          height: 120,
          objectFit: 'cover',
          borderRadius: 4,
          cursor: 'pointer'
        }}
        preview={{
          mask: <><EyeOutlined /> View</>,
        }}
      />
    </div>
  );

  const renderCardContent = () => (
    <div>
      <div style={{ margin: '12px 0' }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MailOutlined style={{ marginRight: 8, color: '#666' }} />
            <Text style={{ color: '#666' }}>{verification.user?.email || 'N/A'}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CalendarOutlined style={{ marginRight: 8, color: '#666' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Submitted: {formatDate(verification.created_at)}
            </Text>
          </div>
        </Space>
      </div>
      
      {expanded && (
        <div style={{ marginTop: 16 }}>
          <Divider orientation="left" style={{ margin: '16px 0', fontSize: 14 }}>Documents</Divider>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            {verification.national_id_image_url && 
              renderDocumentPreview(
                verification.national_id_image_url, 
                'National ID',
                <IdcardOutlined />
              )
            }
            {verification.license_image_url && 
              renderDocumentPreview(
                verification.license_image_url, 
                'Driver License',
                <CarOutlined />
              )
            }
          </div>
          
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {verification.status === 'PENDING' ? (
              <>
                <Button 
                  type="primary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate('APPROVED');
                  }}
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  Approve
                </Button>
                <Button 
                  danger 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate('REJECTED');
                  }}
                  loading={loading}
                  icon={<CloseCircleOutlined />}
                >
                  Reject
                </Button>
              </>
            ) : (
              <Button 
                type="default"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate('PENDING');
                }}
                loading={loading}
                icon={<ClockCircleOutlined />}
              >
                Reset to Pending
              </Button>
            )}
          </div>
        </div>
      )}
      
      <div style={{ 
        marginTop: 12, 
        textAlign: 'center',
        borderTop: '1px dashed #f0f0f0',
        paddingTop: 12
      }}>
        <Button 
          type="link" 
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          icon={expanded ? <CloseCircleOutlined /> : <EyeOutlined />}
          size="small"
        >
          {expanded ? 'Collapse' : 'View Details'}
        </Button>
      </div>
    </div>
  );

  const cardStyle: React.CSSProperties = {
    marginBottom: 16, 
    borderRadius: 8,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    border: '1px solid #f0f0f0',
    transition: 'all 0.3s',
    ':hover': {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      borderColor: '#d9d9d9'
    }
  } as React.CSSProperties;

  return (
    <Card 
      title={renderCardTitle()} 
      size="small"
      style={cardStyle}
      bodyStyle={{ 
        padding: expanded ? 16 : '12px 16px',
        transition: 'all 0.3s'
      }}
      headStyle={{ 
        padding: '0 16px',
        minHeight: 48,
        borderBottom: expanded ? '1px solid #f0f0f0' : 'none'
      }}
      onClick={() => setExpanded(!expanded)}
      hoverable
    >
      {renderCardContent()}
    </Card>
  );
};

export default VerificationCard;
