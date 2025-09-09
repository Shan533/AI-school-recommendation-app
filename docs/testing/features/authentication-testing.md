# Authentication System Testing Guide

This guide covers comprehensive testing of the authentication system, including registration, login, password reset, and user management features.

## 🎯 Overview

The authentication system uses Supabase Auth with the following key features:
- Email/password registration and login
- Google OAuth integration
- Email verification
- Password reset via email
- Username management
- Admin role management

## 📋 Prerequisites

### Environment Setup
- Supabase project configured with Auth enabled
- Email service configured in Supabase (for password reset testing)
- `.env.local` file with correct Supabase credentials
- Development server running (`npm run dev`)

### Test Data Requirements
- Valid email addresses for testing (use temporary email services for testing)
- Admin user account for testing admin features
- Regular user accounts for testing user flows

## 🧪 Authentication Testing Checklist

### 1. User Registration Testing

#### Test Case 1.1: Successful Registration
**Steps:**
1. Navigate to `/register`
2. Fill in valid registration form:
   - Email: `test+register@example.com`
   - Username: `testuser123`
   - Password: `TestPass123!`
   - Confirm Password: `TestPass123!`
3. Click "Sign Up"

**Expected Result:**
- ✅ Registration successful
- ✅ Verification email sent message displayed
- ✅ User redirected to email verification page

#### Test Case 1.2: Registration Validation
**Test scenarios:**
- [ ] **Weak Password**: Password without uppercase/lowercase/number/special char
- [ ] **Invalid Email**: `invalid-email-format`
- [ ] **Username Too Short**: `ab`
- [ ] **Username With Spaces**: `user name`
- [ ] **Password Mismatch**: Different confirm password
- [ ] **Existing Email**: Already registered email
- [ ] **Existing Username**: Already taken username

**Expected Result:** Appropriate validation error messages

#### Test Case 1.3: Email Verification
**Steps:**
1. Complete registration
2. Check email inbox for verification link
3. Click verification link
4. Verify redirection to login or dashboard

**Expected Result:**
- ✅ Email verification successful
- ✅ User can now login

### 2. Login System Testing

#### Test Case 2.1: Successful Login
**Steps:**
1. Navigate to `/login`
2. Enter valid credentials
3. Click "Sign In"

**Expected Result:**
- ✅ Successful login
- ✅ Redirected to appropriate page (dashboard for admin, home for users)
- ✅ Navigation shows user is logged in

#### Test Case 2.2: Login Validation
**Test scenarios:**
- [ ] **Invalid Email Format**: `invalid-email`
- [ ] **Wrong Password**: Correct email, wrong password
- [ ] **Non-existent User**: Valid format but user doesn't exist
- [ ] **Unverified Email**: User registered but email not verified
- [ ] **Empty Fields**: Missing email or password

**Expected Result:** Appropriate error messages displayed

#### Test Case 2.3: Google OAuth Login
**Steps:**
1. Navigate to `/login`
2. Click "Continue with Google"
3. Complete Google authentication flow
4. Verify return to application

**Expected Result:**
- ✅ Google OAuth popup opens
- ✅ User can authenticate with Google
- ✅ Successfully logged into application
- ✅ User profile created automatically

### 3. Password Reset Testing

#### Test Case 3.1: Request Password Reset
**Steps:**
1. Navigate to `/forgot-password`
2. Enter valid email address
3. Click "Send Reset Link"

**Expected Result:**
- ✅ Success message: "Password reset link sent! Check your email."
- ✅ Reset email received in inbox

#### Test Case 3.2: Complete Password Reset Flow
**Steps:**
1. Request password reset (Test Case 3.1)
2. Check email for reset link
3. Click reset link in email
4. Verify redirect to `/auth/reset-password`
5. Enter new password (min 8 characters)
6. Confirm new password
7. Click "Update Password"

**Expected Result:**
- ✅ Reset link is valid and not expired
- ✅ Password form renders correctly
- ✅ Password validation works (min 8 chars, matching confirmation)
- ✅ Success message: "Password updated! Redirecting to sign in..."
- ✅ User automatically logged out
- ✅ Can login with new password

#### Test Case 3.3: Password Reset Edge Cases
**Test scenarios:**
- [ ] **Invalid Email**: Non-existent email address
- [ ] **Expired Link**: Reset link older than expiration time
- [ ] **Already Used Link**: Attempting to use reset link twice
- [ ] **Invalid Link Format**: Malformed reset URL
- [ ] **Short Password**: Less than 8 characters
- [ ] **Mismatched Passwords**: Different confirmation password

**Expected Result:** Appropriate error messages and graceful handling

### 4. User Profile Management Testing

#### Test Case 4.1: Username Update
**Steps:**
1. Login as regular user
2. Navigate to `/profile`
3. Click "Edit" next to username
4. Enter new username
5. Click "Save"

**Expected Result:**
- ✅ Username updated successfully
- ✅ Success message displayed
- ✅ New username reflected in UI

#### Test Case 4.2: Username Validation
**Test scenarios:**
- [ ] **Too Short**: Less than 3 characters
- [ ] **Invalid Characters**: Special characters or spaces
- [ ] **Already Taken**: Username already exists
- [ ] **Same as Current**: No change made

**Expected Result:** Appropriate validation messages

#### Test Case 4.3: Email Update
**Steps:**
1. Login as user
2. Navigate to `/profile`
3. Update email address
4. Verify email confirmation process

**Expected Result:**
- ✅ Email update initiated
- ✅ Verification email sent to new address
- ✅ Email updated after verification

### 5. Admin Authentication Testing

#### Test Case 5.1: Admin Access Control
**Steps:**
1. Login as regular user
2. Attempt to access `/admin/dashboard`

**Expected Result:**
- ✅ Access denied
- ✅ Redirected to login or error page

#### Test Case 5.2: Admin User Management
**Prerequisites:** Login as admin user

**Steps:**
1. Navigate to `/admin/users`
2. Find a regular user
3. Click "Make Admin"
4. Verify user role updated

**Expected Result:**
- ✅ User role updated to admin
- ✅ User can now access admin features

### 6. Session Management Testing

#### Test Case 6.1: Session Persistence
**Steps:**
1. Login to application
2. Close browser tab
3. Reopen application URL

**Expected Result:**
- ✅ User remains logged in
- ✅ Session persists across browser sessions

#### Test Case 6.2: Logout Functionality
**Steps:**
1. Login to application
2. Click logout button/link
3. Attempt to access protected pages

**Expected Result:**
- ✅ User successfully logged out
- ✅ Redirected to public page
- ✅ Cannot access protected pages without re-login

## 🔧 Automated Testing

### Unit Tests Coverage
- **Auth Actions**: 44 tests covering all authentication functions
- **Password Reset**: 8 tests for email and form-based reset
- **Form Components**: 11 tests for auth forms
- **Profile Management**: 9 tests for user profile updates

### Running Tests
```bash
# Run all authentication tests
npm test -- --run auth

# Run specific test suites
npm test -- --run forgot-password
npm test -- --run reset-password
npm test -- --run auth-actions
```

## 🐛 Common Issues & Troubleshooting

### Issue: Email Not Received
**Causes:**
- Email service not configured in Supabase
- Email in spam folder
- Invalid email address
- Rate limiting

**Solutions:**
- Check Supabase Auth settings
- Verify email service configuration
- Check spam/junk folders
- Wait before retrying

### Issue: Reset Link Invalid/Expired
**Causes:**
- Link older than expiration time (default 1 hour)
- Link already used
- Malformed URL

**Solutions:**
- Request new reset link
- Check link format and parameters
- Verify Supabase Auth settings

### Issue: OAuth Not Working
**Causes:**
- OAuth provider not configured
- Incorrect redirect URLs
- Missing environment variables

**Solutions:**
- Configure OAuth provider in Supabase
- Verify redirect URLs match exactly
- Check environment variable configuration

## 📊 Testing Metrics

### Success Criteria
- All authentication flows complete successfully
- Error messages are clear and helpful
- Security measures are effective
- User experience is smooth and intuitive

### Performance Benchmarks
- Login: < 2 seconds
- Registration: < 3 seconds
- Password reset email: < 30 seconds
- Password update: < 2 seconds

## 🔒 Security Testing

### Security Checklist
- [ ] Passwords are hashed and not stored in plain text
- [ ] Password reset links expire appropriately
- [ ] Admin routes are properly protected
- [ ] Session tokens are secure and expire
- [ ] SQL injection prevention is effective
- [ ] XSS protection is implemented

## 📚 Related Documentation

- **[Core Setup Testing](./core-setup-testing.md)** - Basic environment setup
- **[Admin CRUD Testing](./admin-crud-testing.md)** - Admin functionality
- **[Design Document](../design-doc.mdc)** - Authentication architecture
- **[API Documentation](../api-documentation.md)** - Auth endpoints
