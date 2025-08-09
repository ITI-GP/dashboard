import { Col, Row } from "antd";
import { supabase } from "@/providers/supabaseClient";
import { useState, useEffect } from "react";
import { Card, Spin, Alert, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

import {
  CalendarUpcomingEvents,
  DashboardDealsChart,
  DashboardLatestActivities,
  DashboardTotalCountCard,
} from "./components";

type DashboardStats = {
  companyUsers: number;
  individualUsers: number;
  rentalRequests: number;
  isLoading: boolean;
  error: string | null;
};

export const DashboardPage = () => {
  // Dashboard statistics state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    companyUsers: 0,
    individualUsers: 0,
    rentalRequests: 0,
    isLoading: true,
    error: null,
  });

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    console.group('Dashboard Data Fetching');
    console.log('Starting to fetch dashboard stats...');
    
    try {
      setDashboardStats(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Log environment and Supabase client status
      console.log('Environment:', import.meta.env.MODE);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase client status:', supabase ? '✓ Initialized' : '✗ Not initialized');
      
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      // Test connection with a simple query
      console.log('Testing database connection...');
      const { error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error('❌ Database connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      
      console.log('✓ Database connection test successful');
      
      // Fetch all data in parallel for better performance
      const [
        companyUsers,
        individualUsers,
        rentalRequests
      ] = await Promise.all([
        // Company users count
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('isCompany', true),
          
        // Individual users count
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('isCompany', false),
          
        // Rental requests count (try multiple table names)
        (async () => {
          const tableNames = ['rental_requests', 'rentalrequests', 'requests', 'rentals'];
          
          for (const table of tableNames) {
            try {
              const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
                
              if (!error && count !== null) {
                console.log(`✓ Found rental requests in table: ${table}`);
                return { count, error: null };
              }
            } catch (e) {
              console.warn(`⏭️ Table ${table} not found or error:`, e);
            }
          }
          return { count: 0, error: new Error('No valid rental requests table found') };
        })()
      ]);

      // Handle errors from any of the queries
      if (companyUsers.error) throw new Error(`Failed to fetch company users: ${companyUsers.error.message}`);
      if (individualUsers.error) throw new Error(`Failed to fetch individual users: ${individualUsers.error.message}`);
      
      // Update state with fetched data
      setDashboardStats({
        companyUsers: companyUsers.count || 0,
        individualUsers: individualUsers.count || 0,
        rentalRequests: rentalRequests.count || 0,
        isLoading: false,
        error: null,
      });
      
      console.log('✓ Dashboard stats updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error in fetchDashboardStats:', error);
      
      setDashboardStats(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    } finally {
      console.groupEnd();
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Show loading state
  if (dashboardStats.isLoading) {
    return (
      <div className="page-container" style={{ padding: '24px', textAlign: 'center' }}>
        <Card>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading dashboard data...</div>
        </Card>
      </div>
    );
  }

  // Show error state
  if (dashboardStats.error) {
    return (
      <div className="page-container" style={{ padding: '24px' }}>
        <Alert
          message="Error loading dashboard"
          description={
            <div>
              <p>{dashboardStats.error}</p>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={fetchDashboardStats}
                style={{ marginTop: '16px' }}
              >
                Retry
              </Button>
            </div>
          }
          type="error"
          showIcon
        />
      </div>
    );
  }

  // Main dashboard content
  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <Row gutter={[32, 32]}>
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource="companies"
            isLoading={false}
            totalCount={dashboardStats.companyUsers}
          />
        </Col>
        
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource="contacts"
            isLoading={false}
            totalCount={dashboardStats.individualUsers}
          />
        </Col>
        
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource="deals"
            isLoading={false}
            totalCount={dashboardStats.rentalRequests}
            customTitle="Total Rents in Pipeline"
          />
        </Col>
      </Row>

      <Row gutter={[32, 32]} style={{ marginTop: '32px' }}>
        <Col xs={24} sm={24} xl={8} style={{ minHeight: '460px' }}>
          <Card style={{ height: '100%' }}>
            <CalendarUpcomingEvents />
          </Card>
        </Col>
        
        <Col xs={24} sm={24} xl={16} style={{ minHeight: '460px' }}>
          <Card style={{ height: '100%' }}>
            <DashboardDealsChart />
          </Card>
        </Col>
      </Row>

      <Row gutter={[32, 32]} style={{ marginTop: '32px' }}>
        <Col xs={24}>
          <Card>
            <DashboardLatestActivities />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
   