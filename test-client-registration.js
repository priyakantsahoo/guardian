const axios = require('axios');

async function testClientRegistration() {
  try {
    console.log('🧪 Testing client registration with audit logging...');
    
    const response = await axios.post('http://localhost:3002/api/clients/register', {
      name: 'Test Client for Audit',
      description: 'Testing comprehensive audit logging',
      idleTimeoutMinutes: 45
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': 'admin-secure-token-67890-change-in-production',
        'User-Agent': 'Test-Script/1.0 (audit-testing)'
      }
    });
    
    console.log('✅ Client registered successfully:');
    console.log(`   Client ID: ${response.data.clientId}`);
    console.log(`   Client Key: ${response.data.clientKey.substring(0, 12)}...`);
    console.log('');
    
    // Wait a moment for async audit logging to complete
    console.log('⏳ Waiting for audit log to be processed...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return response.data.clientId;
    
  } catch (error) {
    console.error('❌ Client registration failed:', error.response?.data || error.message);
    throw error;
  }
}

async function checkAuditLog(clientId) {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: '69.62.81.203',
    port: 5433,
    database: 'guardian',
    user: 'postgres',
    password: 'postres',
  });
  
  try {
    const result = await pool.query(`
      SELECT 
        event_type, user_email, client_id, ip_address, user_agent, 
        request_method, endpoint, session_id, response_status,
        geo_country, geo_city, request_id, error_code, timestamp
      FROM audit_logs 
      WHERE client_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 1
    `, [clientId]);
    
    if (result.rows.length === 0) {
      console.log('❌ No audit log found for client registration');
      return;
    }
    
    const log = result.rows[0];
    console.log('📋 Audit Log Analysis:');
    console.log('=====================');
    console.log(`Event Type: ${log.event_type}`);
    console.log(`Client ID: ${log.client_id}`);
    console.log(`IP Address: ${log.ip_address || '⚠️  NULL'}`);
    console.log(`User Agent: ${log.user_agent || '⚠️  NULL'}`);
    console.log(`Request Method: ${log.request_method || '⚠️  NULL'}`);
    console.log(`Endpoint: ${log.endpoint || '⚠️  NULL'}`);
    console.log(`Response Status: ${log.response_status || '⚠️  NULL'}`);
    console.log(`Geo Country: ${log.geo_country || '⚠️  NULL'}`);
    console.log(`Geo City: ${log.geo_city || '⚠️  NULL'}`);
    console.log(`Request ID: ${log.request_id || '⚠️  NULL'}`);
    console.log(`Session ID: ${log.session_id || 'N/A (expected for client registration)'}`);
    console.log(`Error Code: ${log.error_code || 'N/A (success case)'}`);
    console.log(`Timestamp: ${log.timestamp}`);
    
    // Count populated fields
    const forensicFields = ['ip_address', 'user_agent', 'request_method', 'endpoint', 'response_status', 'geo_country', 'geo_city', 'request_id'];
    const populatedCount = forensicFields.filter(field => log[field] !== null).length;
    
    console.log('');
    console.log(`📊 Forensic Data Coverage: ${populatedCount}/${forensicFields.length} fields populated`);
    
    if (populatedCount === forensicFields.length) {
      console.log('✅ All forensic fields are now properly populated!');
    } else {
      console.log('⚠️  Some forensic fields are still missing');
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testClientRegistration()
  .then(clientId => checkAuditLog(clientId))
  .catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
  });