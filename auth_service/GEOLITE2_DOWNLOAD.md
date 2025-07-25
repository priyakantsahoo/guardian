# GeoLite2 Database Setup

The Guardian Auth Service uses MaxMind's GeoLite2 database for geolocation tracking of authentication events.

## Download Instructions

1. **Register for a MaxMind Account**
   - Visit: https://www.maxmind.com/en/geolite2/signup
   - Create a free account

2. **Download GeoLite2 City Database**
   - Login to your MaxMind account
   - Go to: https://www.maxmind.com/en/accounts/current/geoip/downloads
   - Download: `GeoLite2 City` in `Binary / MMDB` format

3. **Install the Database**
   ```bash
   # Extract the downloaded file
   tar -xzf GeoLite2-City_*.tar.gz
   
   # Copy to auth_service directory
   cp GeoLite2-City_*/GeoLite2-City.mmdb /path/to/guardian/auth_service/
   ```

4. **Alternative: Disable GeoLocation**
   If you don't want to use geolocation tracking, set in your environment:
   ```bash
   GEOLITE2_ENABLED=false
   ```

## File Information

- **File Name**: `GeoLite2-City.mmdb`
- **Size**: ~60MB
- **Location**: `auth_service/GeoLite2-City.mmdb`
- **Update Frequency**: Monthly (recommended)

## Note

This file is not included in the Git repository due to its large size (58MB). You need to download it separately and place it in the `auth_service` directory before running the application.

The application will work without this file, but geolocation features will be disabled.