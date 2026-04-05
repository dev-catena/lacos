#!/bin/bash
# Output: USER_ID|TOKEN (uma linha)
cd "$(dirname "$0")"
USER_ID=$(php artisan tinker --execute="echo App\Models\User::where('profile','professional_caregiver')->first()->id;" 2>/dev/null | tail -1)
TOKEN=$(php artisan tinker --execute="echo App\Models\User::where('profile','professional_caregiver')->first()->createToken('test')->plainTextToken;" 2>/dev/null | tail -1)
echo "${USER_ID}|${TOKEN}"
