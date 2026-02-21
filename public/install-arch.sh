#!/usr/bin/env sh

set -eu

# Detect if running on Arch Linux
if [ ! -f /etc/arch-release ]; then
  echo "This installer is intended for Arch Linux." >&2
  exit 1
fi

DEST_DIR="${FERRET_INSTALL_DIR:-${HOME}/.local}"
FERRET_DIR="${DEST_DIR}/ferret"
BIN_DIR="${FERRET_DIR}/bin"

# Check if user wants system-wide install
if [ "${FERRET_INSTALL_DIR:-}" = "" ] && [ "$(id -u)" -eq 0 ]; then
  DEST_DIR="/usr/local"
  FERRET_DIR="${DEST_DIR}/ferret"
  BIN_DIR="${FERRET_DIR}/bin"
fi

echo "Installing Ferret to ${FERRET_DIR}"

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

# Remove previous Ferret install (keep other tools in DEST_DIR/bin)
rm -rf "${FERRET_DIR}"
rm -f "${DEST_DIR}/bin/ferret"
rm -rf "${DEST_DIR}/libs" "${DEST_DIR}/toolchain"

# Download and extract
cd "${TEMP_DIR}"
curl -L -o ferret.tar.gz "${DOWNLOAD_URL}"
tar -xzf ferret.tar.gz

# Install to destination
mkdir -p "${FERRET_DIR}/bin"
mkdir -p "${FERRET_DIR}/libs"

# Copy binary
if [ -f "ferret/bin/ferret" ]; then
  cp -f ferret/bin/ferret "${FERRET_DIR}/bin/"
elif [ -f "bin/ferret" ]; then
  cp -f bin/ferret "${FERRET_DIR}/bin/"
elif [ -f "ferret" ]; then
  cp -f ferret "${FERRET_DIR}/bin/"
else
  echo "Error: ferret binary not found in extracted archive" >&2
  exit 1
fi

chmod +x "${FERRET_DIR}/bin/ferret"

# Copy runtime libraries and toolchain (must live at ../libs and ../toolchain relative to bin)
if [ -d "ferret/libs" ]; then
  cp -r ferret/libs/* "${FERRET_DIR}/libs/"
elif [ -d "libs" ]; then
  cp -r libs/* "${FERRET_DIR}/libs/"
fi
if [ -d "ferret/toolchain" ]; then
  cp -r ferret/toolchain "${FERRET_DIR}/"
elif [ -d "toolchain" ]; then
  cp -r toolchain "${FERRET_DIR}/"
fi

echo ""
echo "✓ Ferret installed successfully to ${FERRET_DIR}"
echo ""

# Check if in PATH
if echo "${PATH}" | grep -q "${BIN_DIR}"; then
  echo "✓ ${BIN_DIR} is already in your PATH"
  echo "  Run: ferret --version"
else
  echo "Add to your PATH:"
  echo "  export PATH=\"${BIN_DIR}:\$PATH\""
  echo ""
  echo "Or add to ~/.bashrc:"
  echo "  echo 'export PATH=\"${BIN_DIR}:\$PATH\"' >> ~/.bashrc"
fi
