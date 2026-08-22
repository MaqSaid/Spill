# Load Testing Configuration

## Tool: Locust (Python)

### Installation
```bash
pip install locust
```

### Test Script (locustfile.py)
```python
from locust import HttpUser, task, between

class SubmitUser(HttpUser):
    """Simulates anonymous employees submitting feedback."""
    wait_time = between(1, 5)

    @task(3)
    def submit_feedback(self):
        self.client.post("/api/v1/submissions", json={
            "category": "suggestion",
            "impact": "medium",
            "encrypted_payload": "dGVzdA==",
            "encryption_iv": "aXYxMg==",
            "encrypted_symmetric_key": "a2V5",
            "receipt_hash": "a" * 64,
        })

    @task(2)
    def check_status(self):
        self.client.post("/api/v1/submissions/status", json={
            "receipt_hash": "a" * 64,
        })

    @task(1)
    def health_check(self):
        self.client.get("/health")


class AdminUser(HttpUser):
    """Simulates admin reviewing submissions."""
    wait_time = between(2, 10)

    @task
    def list_submissions(self):
        self.client.get("/api/v1/admin/submissions")
```

### Running
```bash
# Local (targeting dockerized backend)
locust -f locustfile.py --host=http://localhost:8000

# Headless (CI)
locust -f locustfile.py --host=http://localhost:8000 --headless -u 100 -r 10 --run-time 60s
```

### Performance Targets (NFR-3)
- Submission: P95 < 500ms
- Status check: P95 < 200ms
- 1000+ concurrent users sustained
- Error rate < 0.1%
