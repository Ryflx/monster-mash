#!/usr/bin/env bash
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
cd /Users/liamcoates/monster-mash
exec /usr/local/bin/node ./node_modules/vite/bin/vite.js --port 5173
