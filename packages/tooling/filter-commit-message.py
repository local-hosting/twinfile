#!/usr/bin/env python3
"""git filter-branch --msg-filter: stdin commit message → stdout."""
import sys

REPLACEMENTS = [
    ("@local-hosting/twinfile", "@local-hosting/twinfile"),
    ("@local-hosting/twinfile", "@local-hosting/twinfile"),
    ("local-hosting/twinfile", "local-hosting/twinfile"),
    ("github.com/local-hosting", "github.com/local-hosting"),
    ("ghcr.io/local-hosting", "ghcr.io/local-hosting"),
    ("fieldwise-locker", "catalog-host"),
    ("fieldwise-canvas", "map-host"),
    ("Fieldwise Canvas", "catalog map"),
    ("Fieldwise", "portable host"),
    ("fieldwise", "catalog-host"),
    ("Loro pack", "Loro pack"),
    ("loro-pack", "loro-pack"),
    ("river-twinfile", "overlay-pack"),
    ("Tennessee watershed", "watershed overlay"),
    ("Tennessee River", "watershed"),
    ("Chattanooga Tennessee River", "watershed region"),
    ("Chattanooga", "watershed region"),
    ("tennessee-river", "watershed-river"),
    ("spectrum-store", "cable-retail"),
    ("Spectrum", "cable retail"),
    ("local-hosting", "local-hosting"),
    ("FWT", ""),
]

msg = sys.stdin.read()
for old, new in REPLACEMENTS:
    msg = msg.replace(old, new)
sys.stdout.write(msg)