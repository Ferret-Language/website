#!/usr/bin/env sh
set -eu

if [ -z "${TERMUX_VERSION-}" ] && [ "${PREFIX:-}" != "/data/data/com.termux/files/usr" ]; then
  echo "This installer is intended for Termux." >&2
  exit 1
fi

DEST_DIR="${FERRET_INSTALL_DIR:-${PREFIX:-/data/data/com.termux/files/usr}}"

echo "Installing Ferret to ${DEST_DIR}"

# Install only required runtime dependencies
pkg install -y curl tar

# Detect architecture
ARCH=$(uname -m)
case "${ARCH}" in
  x86_64)
    FERRET_ARCH="linux-amd64"
    ;;
  aarch64|arm64)
    FERRET_ARCH="linux-arm64"
    ;;
  *)
    echo "Unsupported architecture: ${ARCH}" >&2
    exit 1
    ;;
esac

# Get latest release URL
RELEASE_URL="https://api.github.com/repos/Ferret-Language/Ferret/releases/latest"
echo "Fetching latest release..."

# Download release info and extract download URL for our architecture
DOWNLOAD_URL=$(curl -sL "${RELEASE_URL}" | grep "browser_download_url.*${FERRET_ARCH}.tar.gz" | cut -d '"' -f 4)

if [ -z "${DOWNLOAD_URL}" ]; then
  echo "Error: Could not find ${FERRET_ARCH} release" >&2
  echo "Available releases: https://github.com/Ferret-Language/Ferret/releases/latest" >&2
  exit 1
fi

echo "Downloading ${DOWNLOAD_URL}..."

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

# Download and extract
cd "${TEMP_DIR}"
curl -L -o ferret.tar.gz "${DOWNLOAD_URL}"
tar -xzf ferret.tar.gz

# Install to destination
mkdir -p "${DEST_DIR}/bin"
mkdir -p "${DEST_DIR}/lib/ferret"

# Copy binary
if [ -f "bin/ferret" ]; then
  cp -f bin/ferret "${DEST_DIR}/bin/"
elif [ -f "ferret" ]; then
  cp -f ferret "${DEST_DIR}/bin/"
else
  echo "Error: ferret binary not found in extracted archive" >&2
  exit 1
fi

chmod +x "${DEST_DIR}/bin/ferret"

# Copy runtime libraries
if [ -d "libs" ]; then
  cp -r libs/* "${DEST_DIR}/lib/ferret/"
fi

echo ""
echo "✓ Ferret installed successfully!"
echo ""

# Check if installed to default Termux location (which is in PATH by default)
default_prefix="/data/data/com.termux/files/usr"
if [ "${DEST_DIR}" = "${PREFIX:-${default_prefix}}" ] || [ "${DEST_DIR}" = "${default_prefix}" ]; then
  echo "✓ The 'ferret' command is now available"
  echo "  Run: ferret --version"
  echo "  If 'ferret' doesn't work, try: exec \$SHELL"
else
  echo "Add to your PATH:"
  echo "  export PATH=\"${DEST_DIR}/bin:\$PATH\""
  echo ""
  echo "Or add to ~/.bashrc:"
  echo "  echo 'export PATH=\"${DEST_DIR}/bin:\$PATH\"' >> ~/.bashrc"
fi
