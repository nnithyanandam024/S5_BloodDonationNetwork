import bcrypt from 'bcryptjs';
import { supabase } from '../src/config/supabase';
import { BloodGroup } from '../src/types';

async function seedSupabase() {
  console.log('🚀 Starting Supabase Database Seeding for BloodLink AFGC...');

  const passwordHash = await bcrypt.hash('Password123!', 8);
  const now = new Date();

  // 1. Seed Demo Profiles (Donors + Hospital)
  const profiles = [
    {
      id: 'donor-john-001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      password_hash: passwordHash,
      phone: '+91 98765 43210',
      role: 'DONOR',
      auth_provider: 'LOCAL',
      blood_group: 'O+',
      date_of_birth: '1998-05-15',
      is_available: true,
      donation_count: 4,
      last_donation_date: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'MG Road, Ashok Nagar',
      city: 'Bengaluru',
    },
    {
      id: 'donor-priya-002',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      password_hash: passwordHash,
      phone: '+91 98765 43211',
      role: 'DONOR',
      auth_provider: 'LOCAL',
      blood_group: 'O-',
      date_of_birth: '2000-08-22',
      is_available: true,
      donation_count: 2,
      last_donation_date: new Date(Date.now() - 130 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 12.978,
      longitude: 77.601,
      address: 'Indiranagar 100ft Rd',
      city: 'Bengaluru',
    },
    {
      id: 'donor-rahul-003',
      name: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      password_hash: passwordHash,
      phone: '+91 98765 43212',
      role: 'DONOR',
      auth_provider: 'LOCAL',
      blood_group: 'O+',
      date_of_birth: '1995-12-05',
      is_available: true,
      donation_count: 6,
      last_donation_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 12.972,
      longitude: 77.595,
      address: 'Brigade Road',
      city: 'Bengaluru',
    },
    {
      id: 'donor-ananya-004',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@example.com',
      password_hash: passwordHash,
      phone: '+91 98765 43213',
      role: 'DONOR',
      auth_provider: 'LOCAL',
      blood_group: 'O+',
      date_of_birth: '1999-03-12',
      is_available: true,
      donation_count: 3,
      last_donation_date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 12.982,
      longitude: 77.608,
      address: 'Koramangala 4th Block',
      city: 'Bengaluru',
    },
    {
      id: 'donor-karthik-005',
      name: 'Karthik Nair',
      email: 'karthik.nair@example.com',
      password_hash: passwordHash,
      phone: '+91 98765 43214',
      role: 'DONOR',
      auth_provider: 'LOCAL',
      blood_group: 'O+',
      date_of_birth: '1997-11-20',
      is_available: true,
      donation_count: 5,
      last_donation_date: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 12.989,
      longitude: 77.615,
      address: 'Ulsoor Lake Road',
      city: 'Bengaluru',
    },
    {
      id: 'donor-sneha-006',
      name: 'Sneha Roy',
      email: 'sneha.roy@example.com',
      password_hash: passwordHash,
      phone: '+91 98765 43215',
      role: 'DONOR',
      auth_provider: 'LOCAL',
      blood_group: 'O-',
      date_of_birth: '2001-07-19',
      is_available: true,
      donation_count: 1,
      last_donation_date: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 12.968,
      longitude: 77.589,
      address: 'Richmond Town',
      city: 'Bengaluru',
    },
    {
      id: 'donor-arjun-007',
      name: 'Arjun Menon',
      email: 'arjun.menon@example.com',
      password_hash: passwordHash,
      phone: '+91 98765 43216',
      role: 'DONOR',
      auth_provider: 'LOCAL',
      blood_group: 'B+',
      date_of_birth: '1996-04-18',
      is_available: true,
      donation_count: 4,
      last_donation_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 12.973,
      longitude: 77.592,
      address: 'Cubbon Park Road',
      city: 'Bengaluru',
    },
    {
      id: 'hospital-city-001',
      name: 'Dr. Ramesh Rao',
      email: 'hospital@citycare.org',
      password_hash: passwordHash,
      phone: '+91 80 2345 6789',
      role: 'HOSPITAL',
      auth_provider: 'LOCAL',
      hospital_name: 'City Care Super Specialty Hospital',
      license_number: 'HOSP-BLR-2024-889',
      latitude: 12.975,
      longitude: 77.599,
      address: 'Residency Road, Bengaluru',
      city: 'Bengaluru',
    },
  ];

  console.log(`📦 Upserting ${profiles.length} user & hospital profiles...`);
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .upsert(profiles, { onConflict: 'id' })
    .select();

  if (profileErr) {
    console.error('❌ Error seeding profiles:', profileErr.message);
    process.exit(1);
  }
  console.log(`✅ Profiles seeded successfully! (${profileData?.length} records)`);

  // 2. Seed Blood Bank Inventory Reserves
  const sampleBanks = [
    {
      id: 'bank-central-001',
      name: 'Bengaluru Central Blood Bank',
      latitude: 12.974,
      longitude: 77.596,
      address: 'MG Road',
    },
    {
      id: 'bank-redcross-002',
      name: 'Red Cross Regional Blood Center',
      latitude: 12.981,
      longitude: 77.605,
      address: 'Indiranagar',
    },
  ];

  const stockProfiles: { group: BloodGroup; count: number; bankIdx: number }[] = [
    { group: 'O+', count: 8, bankIdx: 0 },
    { group: 'O-', count: 3, bankIdx: 0 },
    { group: 'A+', count: 6, bankIdx: 0 },
    { group: 'A-', count: 2, bankIdx: 1 },
    { group: 'B+', count: 5, bankIdx: 1 },
    { group: 'B-', count: 2, bankIdx: 1 },
    { group: 'AB+', count: 4, bankIdx: 0 },
    { group: 'AB-', count: 1, bankIdx: 1 },
  ];

  const expiryDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString();
  const inventoryUnits = [];

  let seq = 1;
  for (const item of stockProfiles) {
    const bank = sampleBanks[item.bankIdx];
    for (let i = 0; i < item.count; i++) {
      const id = `INV-${item.group.replace('+', 'POS').replace('-', 'NEG')}-${seq.toString().padStart(4, '0')}`;
      seq++;
      inventoryUnits.push({
        id,
        blood_bank_id: bank.id,
        blood_bank_name: bank.name,
        blood_group: item.group,
        component: 'RED_BLOOD_CELLS',
        units: 1,
        status: 'AVAILABLE',
        latitude: bank.latitude,
        longitude: bank.longitude,
        storage_address: bank.address,
        expiry_date: expiryDate,
      });
    }
  }

  console.log(`💉 Upserting ${inventoryUnits.length} blood bank inventory units...`);
  const { data: invData, error: invErr } = await supabase
    .from('inventory_units')
    .upsert(inventoryUnits, { onConflict: 'id' })
    .select();

  if (invErr) {
    console.error('❌ Error seeding inventory_units:', invErr.message);
    process.exit(1);
  }
  console.log(`✅ Inventory units seeded successfully! (${invData?.length} units)`);

  console.log('\n🎉 Supabase Database Seeding Complete!');
  console.log('You can now log in with:');
  console.log('• Hospital: hospital@citycare.org / Password123!');
  console.log('• Donor: john.doe@example.com / Password123!');
}

seedSupabase().catch((err) => {
  console.error('Unexpected seeding error:', err);
  process.exit(1);
});
