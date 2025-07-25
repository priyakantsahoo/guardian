-- Insert Admin UI client for testing
INSERT INTO clients (client_id, client_key, name, idle_timeout) 
VALUES ('A2WMVB', '94tR669QIBZ26zCIcOzh6wqLdgGWVVBfeJF5ZNc88BM', 'Admin UI', 1800)
ON CONFLICT (client_id) DO NOTHING;