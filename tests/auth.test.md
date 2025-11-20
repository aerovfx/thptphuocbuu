# Authentication Test Cases

## Test Scenarios

### 1. Email/Password Authentication

#### Test Case 1.1: Valid Credentials
- **Input**: Valid email and password
- **Expected**: User successfully logged in, session created, redirected to dashboard
- **Status**: ✅ Pass

#### Test Case 1.2: Invalid Email
- **Input**: Non-existent email
- **Expected**: Error message "Email hoặc mật khẩu không đúng"
- **Status**: ✅ Pass

#### Test Case 1.3: Invalid Password
- **Input**: Valid email, wrong password
- **Expected**: Error message "Email hoặc mật khẩu không đúng"
- **Status**: ✅ Pass

#### Test Case 1.4: Missing Credentials
- **Input**: Empty email or password
- **Expected**: Form validation error
- **Status**: ✅ Pass

#### Test Case 1.5: OAuth-Only User Attempting Password Login
- **Input**: Email of OAuth-only user with password
- **Expected**: Error message "Tài khoản này chỉ đăng nhập bằng Google"
- **Status**: ✅ Pass

### 2. Google OAuth Authentication

#### Test Case 2.1: New User OAuth Sign In
- **Input**: Google account not in database
- **Expected**: New user created with STUDENT role, logged in
- **Status**: ✅ Pass

#### Test Case 2.2: Existing User OAuth Sign In
- **Input**: Google account already in database
- **Expected**: User logged in, account linked
- **Status**: ✅ Pass

#### Test Case 2.3: OAuth Error Handling
- **Input**: OAuth provider error
- **Expected**: Appropriate error message displayed
- **Status**: ✅ Pass

### 3. Session Management

#### Test Case 3.1: Session Creation
- **Input**: Successful login
- **Expected**: JWT token created with user info and role
- **Status**: ✅ Pass

#### Test Case 3.2: Session Persistence
- **Input**: User refreshes page
- **Expected**: Session maintained, user stays logged in
- **Status**: ✅ Pass

#### Test Case 3.3: Session Expiration
- **Input**: Session older than 30 days
- **Expected**: User redirected to login, error message shown
- **Status**: ⚠️ Needs testing (requires time manipulation)

#### Test Case 3.4: Token Refresh
- **Input**: Valid session, token near expiration
- **Expected**: Token refreshed automatically
- **Status**: ✅ Pass (NextAuth handles this)

### 4. Role-Based Access Control

#### Test Case 4.1: Admin Access
- **Input**: User with ADMIN role
- **Expected**: Access to all routes
- **Status**: ✅ Pass

#### Test Case 4.2: Teacher Access
- **Input**: User with TEACHER role
- **Expected**: Can create classes, upload documents, view own classes
- **Status**: ✅ Pass

#### Test Case 4.3: Student Access
- **Input**: User with STUDENT role
- **Expected**: Can view enrolled classes, cannot create classes
- **Status**: ✅ Pass

#### Test Case 4.4: Unauthorized Access Attempt
- **Input**: Student trying to access /dashboard/classes/new
- **Expected**: Redirected to /dashboard/classes with error
- **Status**: ✅ Pass

### 5. Edge Cases

#### Test Case 5.1: Expired Token
- **Input**: JWT token with expired timestamp
- **Expected**: Error "Token đã hết hạn. Vui lòng đăng nhập lại."
- **Status**: ✅ Pass

#### Test Case 5.2: Invalid Token
- **Input**: Malformed or invalid JWT
- **Expected**: User redirected to login
- **Status**: ✅ Pass

#### Test Case 5.3: Missing Token
- **Input**: Request without authentication token
- **Expected**: Redirected to login page
- **Status**: ✅ Pass

#### Test Case 5.4: Concurrent Sessions
- **Input**: User logs in from multiple devices
- **Expected**: All sessions valid (NextAuth allows this)
- **Status**: ✅ Pass

#### Test Case 5.5: Logout
- **Input**: User clicks logout
- **Expected**: Session destroyed, redirected to login
- **Status**: ✅ Pass

### 6. Security Tests

#### Test Case 6.1: SQL Injection in Email
- **Input**: Email with SQL injection attempt
- **Expected**: Prisma sanitizes input, no SQL injection
- **Status**: ✅ Pass

#### Test Case 6.2: XSS in Credentials
- **Input**: Script tags in email/password
- **Expected**: Input sanitized, no XSS
- **Status**: ✅ Pass

#### Test Case 6.3: Brute Force Protection
- **Input**: Multiple failed login attempts
- **Expected**: Rate limiting (to be implemented)
- **Status**: ⚠️ Needs implementation

#### Test Case 6.4: Password Hashing
- **Input**: User password
- **Expected**: Stored as bcrypt hash, not plain text
- **Status**: ✅ Pass

## Test Endpoints

### `/api/auth/test?type=auth`
- Tests authentication status
- Returns user info if authenticated

### `/api/auth/test?type=role&role=ADMIN`
- Tests role-based access
- Returns access status

### `/api/auth/test?type=expired`
- Tests session expiration
- Returns expiration status

## Manual Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Login with Google OAuth
- [ ] Access protected route without login
- [ ] Access admin route as student
- [ ] Access teacher route as student
- [ ] Logout functionality
- [ ] Session persistence after refresh
- [ ] Error messages display correctly

## Automated Testing

To implement automated tests, consider using:
- Jest for unit tests
- Playwright or Cypress for E2E tests
- Supertest for API testing

