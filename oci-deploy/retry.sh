#!/bin/bash

MAX_RETRIES=500
WAIT_SECONDS=60

echo "Starting terraform apply with retry (max $MAX_RETRIES attempts)..."

for i in $(seq 1 $MAX_RETRIES); do
  echo ""
  echo "Attempt $i / $MAX_RETRIES — $(date)"

  terraform apply -auto-approve

  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success on attempt $i!"
    exit 0
  fi

  echo "❌ Failed (Out of Capacity). Retrying in ${WAIT_SECONDS}s..."
  sleep $WAIT_SECONDS
done

echo ""
echo "⚠️  Gave up after $MAX_RETRIES attempts. Try again later or try a different AD."
exit 1