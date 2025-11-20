# Redis Setup Guide for Rate Limiting

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Start Redis container
docker run -d \
  --name redis-ratelimit \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:alpine

# Verify connection
docker exec -it redis-ratelimit redis-cli ping
# Expected output: PONG
```

### Option 2: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  redis:
    image: redis:alpine
    container_name: redis-ratelimit
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis-data:
```

Start services:
```bash
docker-compose up -d
```

### Option 3: Local Installation

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**CentOS/RHEL:**
```bash
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis
```

## Production Configuration

### Redis with Authentication

```bash
# Generate strong password
openssl rand -base64 32

# Start Redis with password
docker run -d \
  --name redis-ratelimit \
  -p 6379:6379 \
  redis:alpine \
  redis-server --requirepass your_strong_password_here
```

Update `.env`:
```bash
REDIS_PASSWORD=your_strong_password_here
```

### Redis with Persistence

```bash
docker run -d \
  --name redis-ratelimit \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:alpine \
  redis-server --appendonly yes --appendfsync everysec
```

### Redis Cluster (High Availability)

For production environments requiring high availability:

```yaml
version: '3.8'
services:
  redis-master:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-master-data:/data
    command: redis-server --appendonly yes

  redis-replica-1:
    image: redis:alpine
    ports:
      - "6380:6379"
    volumes:
      - redis-replica-1-data:/data
    command: redis-server --appendonly yes --slaveof redis-master 6379
    depends_on:
      - redis-master

  redis-replica-2:
    image: redis:alpine
    ports:
      - "6381:6379"
    volumes:
      - redis-replica-2-data:/data
    command: redis-server --appendonly yes --slaveof redis-master 6379
    depends_on:
      - redis-master

  redis-sentinel-1:
    image: redis:alpine
    command: >
      sh -c "echo 'sentinel monitor mymaster redis-master 6379 2
      sentinel down-after-milliseconds mymaster 5000
      sentinel parallel-syncs mymaster 1
      sentinel failover-timeout mymaster 10000' > /tmp/sentinel.conf &&
      redis-sentinel /tmp/sentinel.conf"
    depends_on:
      - redis-master

volumes:
  redis-master-data:
  redis-replica-1-data:
  redis-replica-2-data:
```

## Testing Connection

```bash
# Test connection
redis-cli ping

# With password
redis-cli -a your_password ping

# From Docker
docker exec -it redis-ratelimit redis-cli ping

# Check info
redis-cli info server
```

## Monitoring

### View Rate Limit Keys

```bash
# List all rate limit keys
redis-cli KEYS "rl:*"

# Count rate limit keys
redis-cli EVAL "return #redis.call('keys', 'rl:*')" 0

# Get specific key info
redis-cli ZRANGE "rl:ip:127.0.0.1" 0 -1 WITHSCORES
```

### Monitor Real-time

```bash
# Watch all commands
redis-cli MONITOR

# Watch specific pattern
redis-cli --bigkeys

# Memory usage
redis-cli INFO memory
```

### Performance Metrics

```bash
# Get stats
redis-cli INFO stats

# Slow log
redis-cli SLOWLOG GET 10
```

## Maintenance

### Clear Rate Limits

```bash
# Clear all rate limit keys
redis-cli EVAL "return redis.call('del', unpack(redis.call('keys', 'rl:*')))" 0

# Clear specific user
redis-cli DEL "rl:ip:192.168.1.1"

# Clear expired keys (automatic)
redis-cli INFO keyspace
```

### Backup and Restore

```bash
# Backup
redis-cli SAVE
docker cp redis-ratelimit:/data/dump.rdb ./backup/

# Restore
docker cp ./backup/dump.rdb redis-ratelimit:/data/
docker restart redis-ratelimit
```

## Troubleshooting

### Connection Refused

```bash
# Check if Redis is running
docker ps | grep redis

# Check Redis logs
docker logs redis-ratelimit

# Verify port is open
netstat -an | grep 6379
```

### High Memory Usage

```bash
# Check memory
redis-cli INFO memory

# Find large keys
redis-cli --bigkeys

# Set memory limit
docker run -d \
  --name redis-ratelimit \
  -p 6379:6379 \
  redis:alpine \
  redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### Slow Performance

```bash
# Check slow queries
redis-cli SLOWLOG GET 10

# Monitor latency
redis-cli --latency

# Optimize
redis-cli CONFIG SET save ""  # Disable RDB snapshots
redis-cli CONFIG SET appendonly yes  # Enable AOF
```

## Security Best Practices

1. **Use Authentication**
   ```bash
   redis-server --requirepass strong_password
   ```

2. **Bind to Localhost** (if not using Docker)
   ```bash
   redis-server --bind 127.0.0.1
   ```

3. **Disable Dangerous Commands**
   ```bash
   redis-server --rename-command FLUSHDB "" --rename-command FLUSHALL ""
   ```

4. **Use TLS** (Production)
   ```bash
   redis-server --tls-port 6379 \
     --tls-cert-file /path/to/cert.pem \
     --tls-key-file /path/to/key.pem \
     --tls-ca-cert-file /path/to/ca.pem
   ```

## Cloud Options

### AWS ElastiCache

```bash
# Update .env
REDIS_HOST=your-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_TLS=true
```

### Redis Cloud

```bash
# Free tier available
REDIS_HOST=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your_password
```

### Azure Cache for Redis

```bash
REDIS_HOST=your-cache.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your_access_key
REDIS_TLS=true
```

## Resources

- [Redis Documentation](https://redis.io/documentation)
- [Redis Best Practices](https://redis.io/topics/admin)
- [Redis Security](https://redis.io/topics/security)
- [Redis Persistence](https://redis.io/topics/persistence)
