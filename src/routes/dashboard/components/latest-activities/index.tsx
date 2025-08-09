import { useState, useEffect } from "react";
import { List, Tag, Card, Spin, Descriptions, Divider } from "antd";
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined,
  CarOutlined,
  UserOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  FileTextOutlined
} from "@ant-design/icons";
const { Item } = Descriptions;
import { Text } from "@/components";
import { supabase } from "@/providers/supabaseClient";

interface UserProfile {
  id: string;
  email: string;
  raw_user_meta_data?: {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    [key: string]: any;
  };
}

interface VehicleOwner {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
}

interface RentalRequest {
  id: number;
  created_at: string;
  user_id: string;
  vehicle_id: number;
  status: string;
  start_date: string;
  end_date: string;
  location: string;
  address: string;
  payment: string;
  notes: string;
  user?: UserProfile;
  vehicle?: {
    id: number;
    owner_id: string;
    owner?: VehicleOwner;
  };
}

interface Deal {
  id: string | number;
  title: string;
  value?: number;
  stage?: string;
  company?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: string;
}

interface Activity {
  id: string;
  title: string;
  message: string;
  created_at: string;
  user_id: string;
  type: 'history' | 'rental';
  status?: string;
  rentalData?: {
    vehicle_id: number;
    start_date: string;
    end_date: string;
    location: string;
    address: string;
    payment: string;
    notes: string;
    contacts: Contact[];
    contact?: Contact; // Keeping for backward compatibility
    deal?: Deal;
  };
}

export const DashboardLatestActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        // Fetch recent history entries
        const { data: historyData, error: historyError } = await supabase
          .from('history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (historyError) throw historyError;

        // Format history data
        const formattedHistory = (historyData || []).map(history => ({
          ...history,
          type: 'history' as const,
        }));

        // Fetch approved rental requests with user and vehicle data
        const { data: rentalData, error: rentalError } = await supabase
          .from('rental_requests')
          .select(`
            *,
            vehicle:vehicle_id (
              id,
              owner_id
            )
          `)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(5);

        if (rentalError) throw rentalError;

        // Get unique user IDs (both renters and vehicle owners)
        const renterIds = [...new Set(rentalData?.map(r => r.user_id).filter(Boolean))];
        const ownerIds = [...new Set(rentalData?.map(r => r.vehicle?.owner_id).filter(Boolean))];
        const allUserIds = [...new Set([...renterIds, ...ownerIds])];
        
        let usersData: Record<string, UserProfile> = {};

        if (allUserIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('id', allUserIds);

          if (!usersError && users) {
            usersData = users.reduce((acc, user) => ({
              ...acc,
              [user.id]: user
            }), {});
          }
        }

        // Fetch related deals data
        const rentalIds = rentalData?.map(r => r.id) || [];
        let dealsData: any[] = [];
        
        if (rentalIds.length > 0) {
          const { data: deals, error: dealsError } = await supabase
            .from('deals')
            .select('*')
            .in('id', rentalIds);
          
          if (!dealsError) {
            dealsData = deals || [];
          }
        }

        // Format rental data with related information
        const formattedRentals = await Promise.all(
          (rentalData || []).map(async (rental: RentalRequest) => {
            const renter = usersData[rental.user_id];
            const owner = rental.vehicle?.owner_id ? usersData[rental.vehicle.owner_id] : null;
            const relatedDeal = dealsData.find(d => d.id === rental.id);
            
            const renterMeta = renter?.raw_user_meta_data || {};
            const ownerMeta = owner?.raw_user_meta_data || {};
            
            const renterInfo: Contact = {
              id: rental.user_id,
              name: renterMeta?.full_name || 'Unknown Renter',
              email: renter?.email || '',
              phone: renterMeta?.phone || 'Not provided',
              avatarUrl: renterMeta?.avatar_url,
              role: 'Renter'
            };

            const ownerInfo: Contact = {
              id: rental.vehicle?.owner_id || '',
              name: ownerMeta?.full_name || 'Unknown Owner',
              email: owner?.email || '',
              phone: ownerMeta?.phone || 'Not provided',
              avatarUrl: ownerMeta?.avatar_url,
              role: 'Vehicle Owner'
            };

            let dealInfo: Deal | undefined;
            
            if (relatedDeal) {
              dealInfo = {
                id: relatedDeal.id,
                title: relatedDeal.title || 'Untitled Deal',
                value: relatedDeal.value,
                stage: relatedDeal.stage,
                company: relatedDeal.company
              };
            }

            return {
              id: rental.id.toString(),
              title: `Rental #${rental.id}`,
              message: `Vehicle #${rental.vehicle_id} rented by ${renterInfo.name}`,
              created_at: rental.created_at,
              user_id: rental.user_id,
              type: 'rental' as const,
              status: rental.status,
              rentalData: {
                vehicle_id: rental.vehicle_id,
                start_date: rental.start_date,
                end_date: rental.end_date,
                location: rental.location || 'Not specified',
                address: rental.address || 'Not specified',
                payment: rental.payment || 'Not specified',
                notes: rental.notes || '',
                contacts: [renterInfo, ownerInfo],
                contact: renterInfo, // For backward compatibility
                deal: dealInfo
              }
            };
          })
        );

        // Combine and sort all activities by date
        const allActivities = [...formattedHistory, ...formattedRentals]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);

        setActivities(allActivities);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityIcon = (activity: Activity) => {
    if (activity.type === 'rental') {
      switch (activity.status?.toLowerCase()) {
        case 'completed':
          return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        case 'pending':
          return <ClockCircleOutlined style={{ color: '#faad14' }} />;
        case 'cancelled':
          return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
        case 'approved':
          return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        default:
          return <CarOutlined style={{ color: '#1890ff' }} />;
      }
    }
    return <InfoCircleOutlined style={{ color: '#722ed1' }} />;
  };

  if (error) {
    return (
      <Card title="Latest Activities" style={{ height: '100%' }}>
        <div className="text-center p-4">
          <Text type="danger">{error}</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <InfoCircleOutlined />
          <Text size="lg" style={{ marginLeft: "0.5rem" }}>
            Latest Activities
          </Text>
        </div>
      }
      style={{ height: '100%' }}
    >
      {loading ? (
        <div className="flex justify-center p-8">
          <Spin />
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={activities}
          renderItem={(activity) => (
            <List.Item>
              <List.Item.Meta
                avatar={getActivityIcon(activity)}
                title={
                  <div className="flex items-center gap-2">
                    <Text strong>{activity.title}</Text>
                    {activity.status && (
                      <Tag 
                        color={
                          activity.status.toLowerCase() === 'completed' ? 'success' :
                          activity.status.toLowerCase() === 'pending' ? 'warning' :
                          activity.status.toLowerCase() === 'cancelled' ? 'error' : 'default'
                        }
                      >
                        {activity.status}
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <div className="w-full">
                    <div className="flex flex-col mb-2">
                      <Text size="sm" className="text-secondary">
                        {activity.message}
                      </Text>
                      <Text size="xs" type="secondary">
                        {new Date(activity.created_at).toLocaleString()}
                      </Text>
                    </div>
                    
                    {activity.type === 'rental' && activity.rentalData && (
                      <div className="mt-2">
                        <Divider orientation="left" orientationMargin={0} style={{ margin: '8px 0' }}>Rental Details</Divider>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Descriptions size="small" column={1}>
                              {activity.rentalData.contacts?.map((contact, index) => (
                                <Item 
                                  key={`${contact.id}-${index}`}
                                  label={
                                    <span className="flex items-center gap-1">
                                      <UserOutlined /> {contact.role}
                                    </span>
                                  }
                                >
                                  <div className="space-y-1">
                                    <div className="font-medium">{contact.name}</div>
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <a href={`tel:${contact.phone}`} className="hover:text-blue-600 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        {contact.phone}
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        {contact.email}
                                      </a>
                                    </div>
                                  </div>
                                </Item>
                              ))}
                              <Item label={
                                <span>
                                  <CalendarOutlined /> Rental Period
                                </span>
                              }>
                                <div>
                                  <div>{new Date(activity.rentalData.start_date).toLocaleDateString()} - {new Date(activity.rentalData.end_date).toLocaleDateString()}</div>
                                </div>
                              </Item>
                              <Item label={
                                <span>
                                  <EnvironmentOutlined /> Location
                                </span>
                              }>
                                <div>
                                  <div>{activity.rentalData.location}</div>
                                  <div className="text-xs text-gray-500">{activity.rentalData.address}</div>
                                </div>
                              </Item>
                            </Descriptions>
                          </div>
                          
                          <div>
                            <Descriptions size="small" column={1}>
                              <Item label={
                                <span>
                                  <CreditCardOutlined /> Payment
                                </span>
                              }>
                                {activity.rentalData.payment || 'N/A'}
                              </Item>
                              {activity.rentalData.deal && (
                                <Item label="Deal">
                                  <div>
                                    <div className="font-medium">{activity.rentalData.deal.title}</div>
                                    {activity.rentalData.deal.value && (
                                      <div className="text-sm">${activity.rentalData.deal.value.toLocaleString()}</div>
                                    )}
                                    {activity.rentalData.deal.stage && (
                                      <Tag color="blue" className="mt-1">{activity.rentalData.deal.stage}</Tag>
                                    )}
                                  </div>
                                </Item>
                              )}
                              {activity.rentalData.notes && (
                                <Item label={
                                  <span>
                                    <FileTextOutlined /> Notes
                                  </span>
                                }>
                                  <div className="text-sm text-gray-600">
                                    {activity.rentalData.notes}
                                  </div>
                                </Item>
                              )}
                            </Descriptions>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};
