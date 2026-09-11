import request from 'supertest';
import { app } from '../src/server';

describe('Milestone 1 Core Flow — End-to-End API Integration', () => {
  let donorToken: string;
  let hospitalToken: string;
  let createdRequestId: string;

  test('Step 1: GET /api/health responds with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('Step 2: Donor logs in successfully and retrieves profile', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'john.doe@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('DONOR');
    expect(res.body.user.bloodGroup).toBe('O+');
    donorToken = res.body.token;

    // Check donor eligibility endpoint
    const eligRes = await request(app)
      .get('/api/donors/eligibility')
      .set('Authorization', `Bearer ${donorToken}`);

    expect(eligRes.status).toBe(200);
    expect(eligRes.body.isEligible).toBe(true);
  });

  test('Step 3: Hospital logs in successfully', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'hospital@citycare.org',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('HOSPITAL');
    hospitalToken = res.body.token;
  });

  test('Step 4: Hospital creates an emergency request for O+, matching and notifying John Doe', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${hospitalToken}`)
      .send({
        bloodGroup: 'O+',
        component: 'WHOLE_BLOOD',
        unitsRequired: 2,
        urgency: 'CRITICAL',
        searchRadiusKm: 10,
        notes: 'Emergency accident victim in ICU',
      });

    expect(res.status).toBe(201);
    expect(res.body.request).toBeDefined();
    expect(res.body.request.status).toBe('NOTIFIED');
    expect(res.body.request.matchedCandidates.length).toBeGreaterThan(0);

    const johnMatch = res.body.request.matchedCandidates.find(
      (c: any) => c.donorName === 'John Doe'
    );
    expect(johnMatch).toBeDefined();
    expect(johnMatch.status).toBe('NOTIFIED');

    createdRequestId = res.body.request.id;
  });

  test('Step 5: Donor retrieves incoming emergency requests', async () => {
    const res = await request(app)
      .get('/api/donors/incoming-requests')
      .set('Authorization', `Bearer ${donorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.requests).toBeDefined();
    const matchingReq = res.body.requests.find((r: any) => r.id === createdRequestId);
    expect(matchingReq).toBeDefined();
    expect(matchingReq.bloodGroup).toBe('O+');
  });

  test('Step 6: Donor accepts the emergency request', async () => {
    const res = await request(app)
      .post('/api/donors/respond')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        requestId: createdRequestId,
        action: 'ACCEPT',
      });

    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('ACCEPTED');
    expect(res.body.request.acceptedDonorName).toBe('John Doe');
  });

  test('Step 7: Hospital verifies real-time status update showing Donor Accepted', async () => {
    const res = await request(app)
      .get(`/api/requests/${createdRequestId}`)
      .set('Authorization', `Bearer ${hospitalToken}`);

    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('ACCEPTED');
    expect(res.body.request.acceptedDonorName).toBe('John Doe');
    expect(res.body.request.acceptedAt).toBeDefined();
  });
});
