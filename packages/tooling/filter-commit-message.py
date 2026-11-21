#!/usr/bin/env python3
"""git filter-branch --msg-filter: stdin commit message → stdout."""
import sys

REPLACEMENTS = [
    ("@doppler-group/twinfile-spec", "@local-hosting/twinfile"),
    ("@doppler-group/twinfile", "@local-hosting/twinfile"),
    ("doppler-group/twinfile", "local-hosting/twinfile"),
    ("github.com/doppler-group", "github.com/local-hosting"),
    ("ghcr.io/doppler-group", "ghcr.io/local-hosting"),
    ("fieldwise-locker", "catalog-host"),
    ("fieldwise-canvas", "map-host"),
    ("Fieldwise Canvas", "catalog map"),
    ("Fieldwise", "portable host"),
    ("fieldwise", "catalog-host"),
    ("Trustbase", "Loro pack"),
    ("trustbase", "loro-pack"),
    ("river-twinfile", "overlay-pack"),
    ("Tennessee watershed", "watershed overlay"),
    ("Tennessee River", "watershed"),
    ("Chattanooga Tennessee River", "watershed region"),
    ("Chattanooga", "watershed region"),
    ("tennessee-river", "watershed-river"),
    ("spectrum-store", "cable-retail"),
    ("Spectrum", "cable retail"),
    ("doppler-group", "local-hosting"),
    ("FWT", ""),
]

msg = sys.stdin.read()
for old, new in REPLACEMENTS:
    msg = msg.replace(old, new)
sys.stdout.write(msg)