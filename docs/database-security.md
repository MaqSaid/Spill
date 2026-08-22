# Database Security Configuration

## Production PostgreSQL Setup

### Minimal Privilege User (Application)
```sql
-- Create application user with minimal permissions
CREATE USER spill_app WITH PASSWORD 'generated_password_here';
GRANT CONNECT ON DATABASE spill TO spill_app;
GRANT USAGE ON SCHEMA public TO spill_app;
GRANT SELECT, INSERT, UPDATE ON submissions TO spill_app;
GRANT SELECT, INSERT ON audit_log TO spill_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO spill_app;

-- NO DROP, CREATE, DELETE, or ALTER permissions
```

### Cleanup User (Retention)
```sql
-- Separate user for data retention cleanup only
CREATE USER spill_cleanup WITH PASSWORD 'different_password_here';
GRANT CONNECT ON DATABASE spill TO spill_cleanup;
GRANT USAGE ON SCHEMA public TO spill_cleanup;
GRANT SELECT, DELETE ON submissions TO spill_cleanup;
-- Can only delete from submissions (for retention cleanup)
```

### SSL Configuration
```
# Connection string for production
SPILL_DATABASE_URL=postgresql+asyncpg://spill_app:password@host:5432/spill?sslmode=require
```

### Encryption at Rest
- Enable PostgreSQL TDE (Transparent Data Encryption) if available
- Or use volume-level encryption (LUKS, AWS EBS encryption, GCP disk encryption)
- Backups must also be encrypted (pg_dump | gpg -e)

### Backup Procedure
```bash
# Daily encrypted backup
pg_dump -U spill_backup spill | gpg --symmetric --cipher-algo AES256 > backup_$(date +%Y%m%d).sql.gpg

# Backup retention: 90 days
find /backups -name "*.sql.gpg" -mtime +90 -delete
```

### Connection Pooling
- Use PgBouncer in production for connection pooling
- Configure pool_size based on expected concurrent connections
- Set statement_timeout to 30s to prevent long-running queries
