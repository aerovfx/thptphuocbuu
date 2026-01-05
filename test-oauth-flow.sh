#!/bin/bash

echo "🔍 Testing OAuth Flow for thptphuocbuu.edu.vn"
echo "=============================================="
echo ""

echo "1️⃣ Testing Providers Endpoint:"
echo "--------------------------------"
curl -s "https://thptphuocbuu.edu.vn/api/auth/providers" | python3 -m json.tool | grep -A 3 "google"
echo ""

echo "2️⃣ Testing Google Sign-In Redirect:"
echo "--------------------------------"
RESPONSE=$(curl -sL "https://thptphuocbuu.edu.vn/api/auth/signin/google" 2>&1)

if echo "$RESPONSE" | grep -q "accounts.google.com"; then
    echo "✅ Redirects to Google OAuth"

    # Extract redirect_uri parameter
    REDIRECT_URI=$(echo "$RESPONSE" | grep -o 'redirect_uri=[^&"]*' | head -1 | sed 's/redirect_uri=//' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))")

    echo "   Redirect URI: $REDIRECT_URI"

    # Check if it contains the correct domain
    if echo "$REDIRECT_URI" | grep -q "thptphuocbuu.edu.vn"; then
        echo "   ✅ Correct domain in redirect_uri"
    else
        echo "   ❌ Wrong domain in redirect_uri"
    fi
else
    echo "❌ Does not redirect to Google OAuth"
    echo "Response:"
    echo "$RESPONSE" | head -20
fi

echo ""
echo "3️⃣ Expected OAuth Configuration:"
echo "--------------------------------"
echo "Google Console should have:"
echo "  • Authorized JavaScript origins:"
echo "    https://thptphuocbuu.edu.vn"
echo ""
echo "  • Authorized redirect URIs:"
echo "    https://thptphuocbuu.edu.vn/api/auth/callback/google"
echo ""
echo "🔗 Configure at: https://console.cloud.google.com/apis/credentials?project=in360project"
