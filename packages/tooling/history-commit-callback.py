"""git-filter-repo --commit-callback: scrub messages only (tree via --replace-text)."""

REPLACEMENTS: list[tuple[bytes, bytes]] = [
    (b"@local-hosting/twinfile", b"@local-hosting/twinfile"),
    (b"@local-hosting/twinfile", b"@local-hosting/twinfile"),
    (b"local-hosting/twinfile", b"local-hosting/twinfile"),
    (b"github.com/local-hosting", b"github.com/local-hosting"),
    (b"ghcr.io/local-hosting", b"ghcr.io/local-hosting"),
    (b"fieldwise-locker", b"catalog-host"),
    (b"fieldwise-canvas", b"map-host"),
    (b"fieldwise", b"catalog-host"),
    (b"Fieldwise", b"portable host"),
    (b"Loro pack", b"Loro pack"),
    (b"loro-pack", b"loro-pack"),
    (b"river-twinfile", b"overlay-pack"),
    (b"Tennessee watershed", b"watershed overlay"),
    (b"Tennessee River", b"watershed"),
    (b"tennessee-river", b"watershed-river"),
    (b"spectrum-store", b"cable-retail"),
    (b"Spectrum", b"cable retail"),
    (b"local-hosting", b"local-hosting"),
    (b"FWT", b""),
]


def commit_callback(commit, metadata):
    message = commit.message
    if not message:
        return
    for old, new in REPLACEMENTS:
        message = message.replace(old, new)
    commit.message = message