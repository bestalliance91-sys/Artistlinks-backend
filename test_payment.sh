#!/bin/bash
TOKEN="LE_VRAI_TOKEN_COPIE"
curl -X POST https://artistlinks-backend-production.up.railway.app/api/v1/payments/initiate -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"tier":"PRO","phoneNumber":"+2250700000000"}'
