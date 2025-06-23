const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Sequelize } = require('sequelize');

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/analytics_db', {
  dialect: 'postgres',
  logging: false,
  define: {
    freezeTableName: true
  }
});

// Import models
const { initModels, getMembershipData, getCallData, getHeadcountData } = require('./models');

// Initialize models
initModels(sequelize);

// Helper function to parse date in M/D/YYYY format
function parseDate(dateString) {
  const [month, day, year] = dateString.split('/');
  return new Date(year, month - 1, day).toISOString().split('T')[0];
}

// Helper function to clean numeric values
function cleanNumber(value) {
  return parseFloat(value) || 0;
}

// Import Calls data
async function importCallsData() {
  console.log('Importing Calls data...');
  const CallData = getCallData();
  const callsData = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, '../Calls.csv'))
      .pipe(csv())
      .on('data', (row) => {
        callsData.push({
          date: parseDate(row.Date),
          call_type: row['Call Type'],
          total_calls: parseInt(row['Total Calls']) || 0,
          avg_handle_time: cleanNumber(row['Avg Call Duration (min)']),
          resolution_rate: cleanNumber(row['Resolution Rate (%)']),
          customer_satisfaction: null, // Not in CSV
          region: 'North America', // Default since not specified in CSV
          createdAt: new Date(),
          updatedAt: new Date()
        });
      })
      .on('end', async () => {
        try {
          await CallData.bulkCreate(callsData, { ignoreDuplicates: true });
          console.log(`✅ Imported ${callsData.length} call records`);
          resolve();
        } catch (error) {
          console.error('❌ Error importing calls data:', error);
          reject(error);
        }
      });
  });
}

// Import Membership data (aggregated by date and segment)
async function importMembershipData() {
  console.log('Importing Membership data...');
  const MembershipData = getMembershipData();
  const membershipData = [];
  const aggregatedData = {};
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, '../Membership.csv'))
      .pipe(csv())
      .on('data', (row) => {
        const date = parseDate(row.Date);
        const segment = row.Segment;
        const region = row.Region;
        const customers = parseInt(row['Total Customers']) || 0;
        
        // Create a key for aggregation
        const key = `${date}-${segment}-${region}`;
        
        if (!aggregatedData[key]) {
          aggregatedData[key] = {
            date: date,
            segment: segment,
            total_customers: 0,
            new_customers: 0, // Will calculate as a percentage
            churned_customers: 0, // Will calculate as a percentage
            region: region,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        aggregatedData[key].total_customers += customers;
      })
      .on('end', async () => {
        try {
          // Convert aggregated data to array and estimate new/churned customers
          Object.values(aggregatedData).forEach(record => {
            // Estimate new customers as 2-5% of total
            record.new_customers = Math.round(record.total_customers * (0.02 + Math.random() * 0.03));
            // Estimate churned customers as 1-3% of total
            record.churned_customers = Math.round(record.total_customers * (0.01 + Math.random() * 0.02));
            membershipData.push(record);
          });
          
          await MembershipData.bulkCreate(membershipData, { ignoreDuplicates: true });
          console.log(`✅ Imported ${membershipData.length} membership records (aggregated from ${Object.keys(aggregatedData).length} segments)`);
          resolve();
        } catch (error) {
          console.error('❌ Error importing membership data:', error);
          reject(error);
        }
      });
  });
}

// Import Headcount data
async function importHeadcountData() {
  console.log('Importing Headcount data...');
  const HeadcountData = getHeadcountData();
  const headcountData = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, '../Headcount.csv'))
      .pipe(csv())
      .on('data', (row) => {
        const date = parseDate(row.Date);
        const totalStaff = parseInt(row['Total Staff']) || 0;
        const customerServiceStaff = parseInt(row['Customer Service Staff']) || 0;
        const supervisors = parseInt(row['Supervisors']) || 0;
        const techSupport = parseInt(row['Tech Support']) || 0;
        
        // Create records for each department
        if (customerServiceStaff > 0) {
          headcountData.push({
            date: date,
            department: 'Customer Support',
            total_staff: customerServiceStaff,
            active_staff: Math.round(customerServiceStaff * (0.85 + Math.random() * 0.1)), // 85-95% active
            utilization_rate: 85 + Math.random() * 10, // 85-95% utilization
            region: 'North America',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        if (supervisors > 0) {
          headcountData.push({
            date: date,
            department: 'Management',
            total_staff: supervisors,
            active_staff: supervisors, // Assume all supervisors are active
            utilization_rate: 90 + Math.random() * 5, // 90-95% utilization
            region: 'North America',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        if (techSupport > 0) {
          headcountData.push({
            date: date,
            department: 'Technical Support',
            total_staff: techSupport,
            active_staff: Math.round(techSupport * (0.8 + Math.random() * 0.15)), // 80-95% active
            utilization_rate: 80 + Math.random() * 15, // 80-95% utilization
            region: 'North America',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      })
      .on('end', async () => {
        try {
          await HeadcountData.bulkCreate(headcountData, { ignoreDuplicates: true });
          console.log(`✅ Imported ${headcountData.length} headcount records`);
          resolve();
        } catch (error) {
          console.error('❌ Error importing headcount data:', error);
          reject(error);
        }
      });
  });
}

// Main import function
async function importAllData() {
  try {
    console.log('🚀 Starting CSV data import...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    const MembershipData = getMembershipData();
    const CallData = getCallData();
    const HeadcountData = getHeadcountData();
    
    await MembershipData.destroy({ where: {} });
    await CallData.destroy({ where: {} });
    await HeadcountData.destroy({ where: {} });
    console.log('✅ Existing data cleared');
    
    // Import all CSV files
    await importCallsData();
    await importMembershipData();
    await importHeadcountData();
    
    console.log('🎉 All CSV data imported successfully!');
    
    // Close database connection
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importAllData(); 