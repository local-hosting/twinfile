"""git-filter-repo --message-callback: scrub commit messages."""

REPLACEMENTS: list[tuple[bytes, bytes]] = [
    (b"@doppler-group/twinfile-spec", b"@local-hosting/twinfile"),
    (b"@doppler-group/twinfile", b"@local-hosting/twinfile"),
    (b"doppler-group/twinfile", b"local-hosting/twinfile"),
    (b"github.com/doppler-group", b"github.com/local-hosting"),
    (b"ghcr.io/doppler-group", b"ghcr.io/local-hosting"),
    (b"fieldwise-locker", b"catalog-host"),
    (b"fieldwise-canvas", b"map-host"),
    (b"Fieldwise Canvas", b"catalog map"),
    (b"Fieldwise", b"portable host"),
    (b"fieldwise", b"catalog-host"),
    (b"Trustbase", b"Loro pack"),
    (b"trustbase", b"loro-pack"),
    (b"river-twinfile", b"overlay-pack"),
    (b"Tennessee watershed", b"watershed overlay"),
    (b"Tennessee River", b"watershed"),
    (b"Chattanooga Tennessee River", b"watershed region"),
    (b"Chattanooga", b"watershed region"),
    (b"tennessee-river", b"watershed-river"),
    (b"spectrum-store", b"cable-retail"),
    (b"Spectrum", b"cable retail"),
    (b"doppler-group", b"local-hosting"),
    (b"FWT", b""),
]


def message_callback(message):
    if message is None:
        return b""
    for old, new in REPLACEMENTS:
        message = message.replace(old, new)
    return message