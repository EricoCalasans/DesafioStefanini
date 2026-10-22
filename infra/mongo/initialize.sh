#!/bin/sh
set -eu

attempt=1
while [ "$attempt" -le 20 ]; do
    if mongosh "$MONGO_ADMIN_URI" --quiet --eval 'const result=db.adminCommand({ping:1}); quit(result.ok===1?0:1)' >/dev/null 2>&1; then
        exec mongosh "$MONGO_ADMIN_URI" --quiet --file /scripts/bootstrap.js
    fi

    sleep 1
    attempt=$((attempt + 1))
done

echo 'MongoDB did not accept an authenticated bootstrap connection after 20 attempts.' >&2
exit 1
