# Admin Login Fix - Setup Guide

## Problem

When attempting to login as admin with a newly created admin account, the error "User is not an admin" appears, even though the account was created successfully.

## Root Causes

1. **Firestore security rules** - The REST API request to fetch user profile gets 403 Forbidden
2. **Mismatched UIDs** - Old create-admin.js script created Firestore docs with random UUIDs instead of Firebase Auth UIDs
3. **Missing Firebase Auth user** - Admin accounts need both Firebase Auth users AND Firestore documents

## Solution Implemented

### 1. Updated Authentication Flow

- Modified `src/services/firebaseAuth.ts` to use authenticated tokens for Firestore requests
- Added backend verification endpoint at `api/auth/verify-admin.js` to verify admin status
- Enhanced error handling with fallback authentication methods

### 2. Firestore Security Rules

Created `firestore.rules` with proper security configuration that allows:

- Authenticated users to read their own user documents
- Admin functions to access and modify user data
- Backend services to verify admin status

**Deploy these rules to Firebase Console:**

1. Go to Firebase Console → Firestore Database → Rules
2. Replace the rules with contents from `firestore.rules`
3. Click "Publish"

### 3. Improved Admin Creation Script

Updated `scripts/create-admin.js` to properly create admin accounts:

- Creates Firebase Auth user with email/password
- Creates matching Firestore document with admin role
- Sets custom claims on the Auth token
- Uses Firebase UID as the document ID (matching Auth system)

## How to Create a New Admin Account

### Option 1: Using the Updated Script (Recommended)

```bash
node scripts/create-admin.js <email> <password> <name>
```

Example:

```bash
node scripts/create-admin.js admingym@gmail.com Admin@12345 "Admin User"
```

This will:

1. ✅ Create a Firebase Auth user
2. ✅ Create a matching Firestore document
3. ✅ Set admin custom claims
4. ✅ Output the admin details for login

### Option 2: Manual Creation via Firebase Console

1. Go to Firebase Console → Authentication
2. Click "Add User"
3. Enter email and password
4. Go to Firestore Database → users collection
5. Create a new document with:
   - Document ID: (Copy the UID from Firebase Auth)
   - Fields:
     ```
     id: <uid>
     email: <admin email>
     name: <admin name>
     role: ADMIN
     is_active: true
     is_verified: true
     phone: ""
     created_at: <current date>
     updated_at: <current date>
     ```

## Testing Admin Login

1. Run the application: `npm run dev:all`
2. Navigate to `http://localhost:5173/admin/login`
3. Enter admin email and password
4. Should successfully login and redirect to admin dashboard

## Troubleshooting

### Still Getting "User is not an admin"?

**Check 1: Verify Firestore Rules are Deployed**

```
Firebase Console → Firestore → Rules
Should contain authentication checks for /users/{userId}
```

**Check 2: Check User Document in Firestore**

```
Firestore → users collection
Document ID should match Firebase Auth UID (not random UUID)
role field should be set to "ADMIN"
```

**Check 3: Check Firebase Auth User**

```
Firebase Console → Authentication
User should exist with the correct email
```

**Check 4: Verify .env Configuration**

```
.env.local should have:
- FIREBASE_SERVICE_ACCOUNT_JSON (for backend service)
- VITE_FIREBASE_API_KEY (for frontend API calls)
- VITE_FIREBASE_PROJECT_ID (should be: disaster-management-4)
```

**Check 5: Check Browser Console**
When attempting to login, check console for error messages:

- `403 Forbidden` on Firestore request → Deploy firestore.rules
- `User is not an admin` → Check user document role field
- `Invalid email or password` → Check Firebase Auth user exists

## Environment Setup for Backend

Create or update `.env.local` with:

```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
REACT_APP_FIREBASE_API_KEY=AIzaSyBaDPNsACKfW__itn-3hYK0qGtkQxBEHjk
```

The service account JSON is required for the backend verification endpoint to work properly.

## Files Modified

1. **src/services/firebaseAuth.ts**
   - Updated profileResponse fetch to use authenticated token
   - Added verifyAdminStatus function
   - Enhanced error handling

2. **scripts/create-admin.js**
   - Now creates both Firebase Auth and Firestore entities
   - Uses Firebase UID for document ID
   - Sets custom claims

3. **api/auth/verify-admin.js** (NEW)
   - Backend endpoint for admin verification
   - Used as fallback when Firestore fetch fails

4. **firestore.rules** (NEW)
   - Security rules for Firestore collections
   - Allows authenticated users to read their documents
   - Defines admin verification helpers

## Additional Notes

- The custom claims set by the script don't need to be explicitly checked on first login since the Firestore document has the role field
- Custom claims are refreshed on token refresh, providing an additional layer of admin verification
- The backend endpoint can be extended to provide additional admin-related security checks
