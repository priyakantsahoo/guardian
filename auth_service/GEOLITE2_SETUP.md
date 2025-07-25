# GeoLite2 Setup Guide

The Guardian Auth Service includes optional geolocation functionality using MaxMind's GeoLite2 database for IP address geolocation in audit logs.

## What is GeoLite2?

GeoLite2 is MaxMind's free geolocation database that provides country and city-level IP geolocation data. The auth service uses this to populate the `geo_country` and `geo_city` fields in audit logs.

## Setup Instructions

### 1. Download GeoLite2 Database

1. Visit: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
2. Create a free MaxMind account
3. Download the **GeoLite2 City** database in **MMDB binary format**
4. Save the file (e.g., `GeoLite2-City.mmdb`) to your server

### 2. Configure the Auth Service

Add the database path to your configuration:

**Option A: Environment Variable**
```bash
export GEOLITE2_DATABASE_PATH=/path/to/GeoLite2-City.mmdb
```

**Option B: Application Properties**
```properties
# In application.properties
geolite2.database.path=/path/to/GeoLite2-City.mmdb
```

**Option C: .env File**
```env
# In .env file
GEOLITE2_DATABASE_PATH=/path/to/GeoLite2-City.mmdb
```

### 3. Update Environment Variables (if using .env)

If using the .env file approach, add to your `.env`:
```env
GEOLITE2_DATABASE_PATH=/opt/geolite2/GeoLite2-City.mmdb
```

And update `application.properties`:
```properties
geolite2.database.path=${GEOLITE2_DATABASE_PATH:}
```

### 4. Restart the Application

After configuration, restart the Spring Boot application. You should see:
```
✅ GeoLite2 database loaded from: /path/to/GeoLite2-City.mmdb
```

## Fallback Behavior

If GeoLite2 is not configured or the database file is missing:
- The service will use a basic fallback geolocation system
- Localhost/private IPs will be marked as "Local"
- Unknown public IPs will be marked as "Unknown"
- No errors will occur - the service degrades gracefully

## Database Updates

GeoLite2 databases are updated monthly. To keep your geolocation data current:
1. Download the latest database file
2. Replace the existing file
3. Restart the application (or implement hot-reload if needed)

## Production Recommendations

1. **Automated Updates**: Set up a cron job to download monthly updates
2. **File Permissions**: Ensure the application has read access to the database file
3. **Backup**: Keep a backup of the working database file
4. **Monitoring**: Monitor logs to ensure the database loads successfully

## Troubleshooting

**Database not loading:**
- Check file path is correct
- Verify file permissions
- Ensure the file is the MMDB format (not CSV)

**Performance concerns:**
- GeoLite2 lookups are performed asynchronously
- Database is memory-mapped for fast access
- No impact on auth service response times

## License

GeoLite2 databases are distributed under the Creative Commons Attribution-ShareAlike 4.0 International License. See MaxMind's website for full terms.