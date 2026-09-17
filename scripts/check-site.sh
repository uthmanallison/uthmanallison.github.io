#!/bin/sh
set -eu

pages="
index.html
work/job-search-agent/index.html
work/melanoma-detection/index.html
work/offline-literacy-platform/index.html
work/awaledger/index.html
privacy/index.html
"

for page in $pages; do
  test -f "$page"
  tidy_output=$(tidy -utf8 --new-blocklevel-tags header,nav,main,section,article,aside,footer --new-inline-tags time -quiet -errors "$page" 2>&1 || true)
  if printf '%s\n' "$tidy_output" | rg -q ' - Error:'; then
    printf '%s\n' "$tidy_output"
    exit 1
  fi
  test "$(rg -c '<h1[ >]' "$page")" -eq 1
  rg -q '<meta name="description" content="[^"]+">' "$page"
  rg -q '<link rel="canonical" href="https://uthmanallison\.com/' "$page"
  rg -q '<meta property="og:title" content="[^"]+">' "$page"
  rg -q 'class="skip-link"' "$page"
  rg -q 'src="/js/analytics\.js"' "$page"
done

xmllint --noout sitemap.xml
test "$(cat CNAME)" = "uthmanallison.com"
test -f assets/img/social-card.png
test "$(stat -f %z assets/img/social-card.png)" -lt 307200
rg -q 'G-VWG0C7WTQ4' js/analytics.js
! rg -i 'bootstrap|fontawesome|iconify|vendor/devicons|fonts\.googleapis' --glob '*.html' --glob '*.css' --glob '*.js'
node scripts/check-analytics.js

printf '%s\n' "Site checks passed."
