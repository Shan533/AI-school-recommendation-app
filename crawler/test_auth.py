#!/usr/bin/env python3
"""
Test Supabase Authentication and Permissions
"""

import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Load environment variables from .env file
load_dotenv('.env')

async def test_supabase_auth():
    """Test Supabase authentication and permissions"""
    print("🔍 Testing Supabase Authentication and Permissions")
    print("=" * 60)
    
    # Check environment variables
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    print(f"📋 Environment Variables:")
    print(f"   SUPABASE_URL: {'✅ Set' if supabase_url else '❌ Missing'}")
    print(f"   SUPABASE_KEY: {'✅ Set' if supabase_key else '❌ Missing'}")
    
    if not supabase_url or not supabase_key:
        print("\n❌ Missing required environment variables!")
        return False
    
    print(f"\n🔗 Testing Supabase Connection...")
    
    # Test 1: Basic connection
    print("\n1️⃣ Testing basic connection...")
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{supabase_url}/rest/v1/", headers={
                'apikey': supabase_key,
                'Authorization': f'Bearer {supabase_key}'
            })
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print("   ✅ Connection successful")
            else:
                print(f"   ❌ Connection failed: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    # Test 2: Check if we can read from unreviewed_schools
    print("\n2️⃣ Testing read access to unreviewed_schools...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{supabase_url}/rest/v1/unreviewed_schools?select=count", headers={
                'apikey': supabase_key,
                'Authorization': f'Bearer {supabase_key}'
            })
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print("   ✅ Read access successful")
                print(f"   Response: {response.text}")
            else:
                print(f"   ❌ Read access failed: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ Read test error: {e}")
    
    # Test 3: Try to insert a test record
    print("\n3️⃣ Testing insert access to unreviewed_schools...")
    try:
        test_data = {
            'name': 'TEST UNIVERSITY - DELETE ME',
            'location': 'Test Location',
            'website': 'https://test.edu',
            'description': 'This is a test record - please delete',
            'source_url': 'https://test.com',
            'confidence_score': 0.5,
            'raw_data': {'test': True},
            'status': 'pending'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{supabase_url}/rest/v1/unreviewed_schools", 
                headers={
                    'apikey': supabase_key,
                    'Authorization': f'Bearer {supabase_key}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                json=test_data
            )
            
            print(f"   Status: {response.status_code}")
            if response.status_code == 201:
                print("   ✅ Insert access successful!")
                print("   🎉 You can write to unreviewed_schools table!")
                
                # Try to delete the test record
                print("\n4️⃣ Cleaning up test record...")
                # Note: You might need to implement delete functionality
                print("   ⚠️  Test record created - you may want to delete it manually")
                
            else:
                print(f"   ❌ Insert access failed: {response.text[:200]}")
                
    except Exception as e:
        print(f"   ❌ Insert test error: {e}")
    
    # Test 4: Check RLS policies
    print("\n5️⃣ Checking RLS policies...")
    try:
        async with httpx.AsyncClient() as client:
            # Try to get policy information
            response = await client.get(f"{supabase_url}/rest/v1/rpc/get_policies", headers={
                'apikey': supabase_key,
                'Authorization': f'Bearer {supabase_key}'
            })
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print("   ✅ Policy check successful")
            else:
                print("   ⚠️  Could not check policies directly")
    except Exception as e:
        print("   ⚠️  Policy check not available")
    
    print("\n" + "=" * 60)
    print("📊 AUTHENTICATION TEST COMPLETE")
    
    return True

async def main():
    """Main function"""
    await test_supabase_auth()

if __name__ == "__main__":
    asyncio.run(main())
